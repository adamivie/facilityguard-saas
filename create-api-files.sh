#!/bin/bash

# Script to create API files on EC2 server and clean up any files in wrong location
# Run this script on the EC2 server after SSH connection

echo "🚀 FacilityGuard API Setup Script"
echo "================================="

# Navigate to project directory
cd ~/facilityguard-saas

echo "📍 Current directory: $(pwd)"

# Clean up any accidentally created files in ~/src (wrong location)
echo "🧹 Cleaning up any files in wrong location (~/src)..."
if [ -d ~/src ]; then
    echo "Found ~/src directory - removing it..."
    rm -rf ~/src
    echo "✅ Removed ~/src directory"
else
    echo "✅ No ~/src directory found - nothing to clean"
fi

# Ensure API directories exist
echo "📁 Creating API directory structure..."
mkdir -p src/app/api/auth/register
mkdir -p src/app/api/auth/login
mkdir -p src/app/api/auth/me
mkdir -p src/app/api/organizations
mkdir -p src/app/api/facilities
mkdir -p src/app/api/surveys
mkdir -p src/app/api/responses

echo "✅ API directories created"

# Install required dependencies
echo "📦 Installing required dependencies..."
npm install bcryptjs jsonwebtoken
npm install --save-dev @types/bcryptjs @types/jsonwebtoken

echo "✅ Dependencies installed"

# Create User Registration API
echo "🔐 Creating User Registration API..."
cat > src/app/api/auth/register/route.ts << 'EOF'
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, firstName, lastName, organizationName } = body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !organizationName) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists with this email' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user and organization in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create organization
      const organization = await tx.organization.create({
        data: {
          name: organizationName,
          plan: 'starter',
          status: 'active',
        },
      });

      // Create user
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          role: 'admin',
          status: 'active',
        },
      });

      // Create organization membership
      await tx.organizationMember.create({
        data: {
          userId: user.id,
          organizationId: organization.id,
          role: 'owner',
          status: 'active',
        },
      });

      return { user, organization };
    });

    // Return success response (don't include password)
    const { password: _, ...userWithoutPassword } = result.user;

    return NextResponse.json({
      message: 'User and organization created successfully',
      user: userWithoutPassword,
      organization: result.organization,
    }, { status: 201 });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
EOF

# Create User Login API
echo "🔑 Creating User Login API..."
cat > src/app/api/auth/login/route.ts << 'EOF'
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'your-secret-key';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user with organization membership
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        organizationMembers: {
          include: {
            organization: true,
          },
          where: {
            status: 'active',
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check if user is active
    if (user.status !== 'active') {
      return NextResponse.json(
        { error: 'Account is not active' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Create JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationMembers[0]?.organization.id,
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return success response (don't include password)
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      message: 'Login successful',
      token,
      user: userWithoutPassword,
      organization: user.organizationMembers[0]?.organization,
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
EOF

# Create User Profile API
echo "👤 Creating User Profile API..."
cat > src/app/api/auth/me/route.ts << 'EOF'
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'your-secret-key';

function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Get user with organization details
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        organizationMembers: {
          include: {
            organization: true,
          },
          where: {
            status: 'active',
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Return user profile (don't include password)
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      user: userWithoutPassword,
      organization: user.organizationMembers[0]?.organization,
    });

  } catch (error) {
    console.error('Profile error:', error);
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 401 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
EOF

# Create Organizations API
echo "🏢 Creating Organizations API..."
cat > src/app/api/organizations/route.ts << 'EOF'
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'your-secret-key';

function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

// GET - Get organization details
export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    const organization = await prisma.organization.findFirst({
      where: {
        organizationMembers: {
          some: {
            userId: decoded.userId,
            status: 'active',
          },
        },
      },
      include: {
        facilities: {
          orderBy: { createdAt: 'desc' },
        },
        organizationMembers: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                status: true,
              },
            },
          },
        },
        _count: {
          select: {
            facilities: true,
            surveys: true,
          },
        },
      },
    });

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ organization });

  } catch (error) {
    console.error('Get organization error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT - Update organization
export async function PUT(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const body = await request.json();
    const { name, plan } = body;

    // Check if user is owner or admin of the organization
    const membership = await prisma.organizationMember.findFirst({
      where: {
        userId: decoded.userId,
        status: 'active',
        role: { in: ['owner', 'admin'] },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const updatedOrganization = await prisma.organization.update({
      where: { id: membership.organizationId },
      data: {
        ...(name && { name }),
        ...(plan && { plan }),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: 'Organization updated successfully',
      organization: updatedOrganization,
    });

  } catch (error) {
    console.error('Update organization error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
EOF

# Create Facilities API
echo "🏭 Creating Facilities API..."
cat > src/app/api/facilities/route.ts << 'EOF'
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'your-secret-key';

function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

// GET - Get all facilities for the organization
export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Get user's organization
    const membership = await prisma.organizationMember.findFirst({
      where: {
        userId: decoded.userId,
        status: 'active',
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'No active organization membership found' },
        { status: 403 }
      );
    }

    const facilities = await prisma.facility.findMany({
      where: {
        organizationId: membership.organizationId,
      },
      include: {
        surveys: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        _count: {
          select: {
            surveys: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ facilities });

  } catch (error) {
    console.error('Get facilities error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST - Create new facility
export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const body = await request.json();
    const { name, type, address, contactEmail, contactPhone } = body;

    // Validate required fields
    if (!name || !type || !address) {
      return NextResponse.json(
        { error: 'Name, type, and address are required' },
        { status: 400 }
      );
    }

    // Get user's organization
    const membership = await prisma.organizationMember.findFirst({
      where: {
        userId: decoded.userId,
        status: 'active',
        role: { in: ['owner', 'admin'] },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const facility = await prisma.facility.create({
      data: {
        name,
        type,
        address,
        contactEmail,
        contactPhone,
        status: 'active',
        organizationId: membership.organizationId,
      },
    });

    return NextResponse.json({
      message: 'Facility created successfully',
      facility,
    }, { status: 201 });

  } catch (error) {
    console.error('Create facility error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
EOF

# Create Surveys API
echo "📋 Creating Surveys API..."
cat > src/app/api/surveys/route.ts << 'EOF'
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'your-secret-key';

function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

// GET - Get all surveys for the organization
export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Get user's organization
    const membership = await prisma.organizationMember.findFirst({
      where: {
        userId: decoded.userId,
        status: 'active',
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'No active organization membership found' },
        { status: 403 }
      );
    }

    const surveys = await prisma.survey.findMany({
      where: {
        organizationId: membership.organizationId,
      },
      include: {
        facility: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        _count: {
          select: {
            responses: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ surveys });

  } catch (error) {
    console.error('Get surveys error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST - Create new survey
export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);
    
    if (!token) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const body = await request.json();
    const { title, description, facilityId, questions } = body;

    // Validate required fields
    if (!title || !facilityId || !questions || questions.length === 0) {
      return NextResponse.json(
        { error: 'Title, facility, and questions are required' },
        { status: 400 }
      );
    }

    // Get user's organization
    const membership = await prisma.organizationMember.findFirst({
      where: {
        userId: decoded.userId,
        status: 'active',
        role: { in: ['owner', 'admin'] },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Verify facility belongs to organization
    const facility = await prisma.facility.findFirst({
      where: {
        id: facilityId,
        organizationId: membership.organizationId,
      },
    });

    if (!facility) {
      return NextResponse.json(
        { error: 'Facility not found' },
        { status: 404 }
      );
    }

    const survey = await prisma.survey.create({
      data: {
        title,
        description,
        questions: JSON.stringify(questions),
        status: 'active',
        facilityId,
        organizationId: membership.organizationId,
      },
    });

    return NextResponse.json({
      message: 'Survey created successfully',
      survey,
    }, { status: 201 });

  } catch (error) {
    console.error('Create survey error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
EOF

# Create Responses API
echo "📝 Creating Responses API..."
cat > src/app/api/responses/route.ts << 'EOF'
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Get all responses (with authentication for organization members)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const surveyId = searchParams.get('surveyId');
    const facilityId = searchParams.get('facilityId');

    let whereClause: any = {};

    if (surveyId) {
      whereClause.surveyId = surveyId;
    }

    if (facilityId) {
      whereClause.survey = {
        facilityId: facilityId,
      };
    }

    const responses = await prisma.response.findMany({
      where: whereClause,
      include: {
        survey: {
          include: {
            facility: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });

    return NextResponse.json({ responses });

  } catch (error) {
    console.error('Get responses error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST - Submit new response (public endpoint for survey submissions)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { surveyId, answers, rating, comments } = body;

    // Validate required fields
    if (!surveyId || !answers) {
      return NextResponse.json(
        { error: 'Survey ID and answers are required' },
        { status: 400 }
      );
    }

    // Verify survey exists and is active
    const survey = await prisma.survey.findUnique({
      where: { id: surveyId },
    });

    if (!survey || survey.status !== 'active') {
      return NextResponse.json(
        { error: 'Survey not found or not active' },
        { status: 404 }
      );
    }

    const response = await prisma.response.create({
      data: {
        surveyId,
        answers: JSON.stringify(answers),
        rating,
        comments,
        submittedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: 'Response submitted successfully',
      response: {
        id: response.id,
        submittedAt: response.submittedAt,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Submit response error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
EOF

echo ""
echo "🎉 API Setup Complete!"
echo "====================="
echo "✅ Cleaned up wrong directory (~/src)"
echo "✅ Created all API directory structure"
echo "✅ Installed required dependencies"
echo "✅ Created all API route files:"
echo "   - Authentication APIs (register, login, profile)"
echo "   - Organizations API"
echo "   - Facilities API"
echo "   - Surveys API"  
echo "   - Responses API"
echo ""
echo "🔄 Next steps:"
echo "1. Rebuild the application: npm run build"
echo "2. Restart PM2: pm2 restart facilityguard"
echo "3. Test the APIs at: http://34.220.120.69/api/"
echo ""
echo "🔗 API Endpoints created:"
echo "   POST /api/auth/register - User registration"
echo "   POST /api/auth/login - User login"
echo "   GET  /api/auth/me - User profile"
echo "   GET  /api/organizations - Get organization"
echo "   PUT  /api/organizations - Update organization"
echo "   GET  /api/facilities - Get facilities"
echo "   POST /api/facilities - Create facility"
echo "   GET  /api/surveys - Get surveys"
echo "   POST /api/surveys - Create survey"
echo "   GET  /api/responses - Get responses"
echo "   POST /api/responses - Submit response"
EOF

echo "✅ Created API setup script: create-api-files.sh"

# Make the script executable and copy it to the server
<function_calls>
<invoke name="run_in_terminal">
<parameter name="explanation">Copy the API setup script to the EC2 server