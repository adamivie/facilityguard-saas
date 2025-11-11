'use client';'use client';



import { useEffect } from 'react';import { useEffect } from 'react';

import { useAuth } from '@/lib/auth-context';import { useAuth } from '@/lib/auth-context';

import { useRouter } from 'next/navigation';import { useRouter } from 'next/navigation';

import AuthForm from '@/components/AuthForm';import AuthForm from '@/components/AuthForm';



export default function HomePage() {export default function HomePage() {

  const { isAuthenticated, isLoading } = useAuth();  const { isAuthenticated, isLoading } = useAuth();

  const router = useRouter();  const router = useRouter();



  useEffect(() => {  useEffect(() => {

    if (!isLoading && isAuthenticated) {    if (!isLoading && isAuthenticated) {

      router.push('/dashboard');      router.push('/dashboard');

    }    }

  }, [isAuthenticated, isLoading, router]);  }, [isAuthenticated, isLoading, router]);



  if (isLoading) {  if (isLoading) {

    return (    return (

      <div className="min-h-screen flex items-center justify-center">      <div className="min-h-screen flex items-center justify-center">

        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>

      </div>      </div>

    );    );

  }  }



  if (isAuthenticated) {  if (isAuthenticated) {

    return null; // Will redirect to dashboard    return null; // Will redirect to dashboard

  }  }



  return <AuthForm />;  return <AuthForm />;

}}
    {
      name: 'Starter',
      price: '$29',
      description: 'Perfect for small businesses',
      features: [
        'Up to 5 facilities',
        '1,000 survey responses/month',
        'Basic analytics',
        'Email support',
        'QR code generation'
      ],
      popular: false
    },
    {
      name: 'Professional',
      price: '$99',
      description: 'For growing organizations',
      features: [
        'Up to 25 facilities',
        '10,000 survey responses/month',
        'Advanced analytics & reporting',
        'Priority support',
        'Custom branding',
        'API access',
        'Data export'
      ],
      popular: true
    },
    {
      name: 'Enterprise',
      price: '$299',
      description: 'For large organizations',
      features: [
        'Unlimited facilities',
        'Unlimited survey responses',
        'Custom integrations',
        'Dedicated account manager',
        'White-label solution',
        'SLA guarantee',
        'Advanced security',
        'SSO integration'
      ],
      popular: false
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <Building2 className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">FacilityGuard</span>
              <Badge variant="secondary" className="ml-2">SaaS</Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" asChild>
                <Link href="/auth/signin">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/auth/signup">Start Free Trial</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Transform Your Facility
            <span className="text-blue-600 block">Maintenance Operations</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Multi-tenant SaaS platform for real-time facility feedback, maintenance tracking, 
            and customer satisfaction analytics. Get actionable insights from every patron interaction.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8" asChild>
              <Link href="/auth/signup">Start 14-Day Free Trial</Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8" asChild>
              <Link href="/demo">Watch Demo</Link>
            </Button>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            No credit card required • Setup in 5 minutes • Cancel anytime
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Everything You Need for Multi-Tenant Facility Management
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Building2 className="h-8 w-8" />,
                title: 'Multi-Tenant Architecture',
                description: 'Secure organization isolation with role-based access control and white-label options'
              },
              {
                icon: <BarChart3 className="h-8 w-8" />,
                title: 'Real-Time Analytics',
                description: 'Advanced reporting dashboard with usage analytics and maintenance insights'
              },
              {
                icon: <Shield className="h-8 w-8" />,
                title: 'Enterprise SSO',
                description: 'Google, Microsoft, and Auth0 integration with enterprise-grade security'
              },
              {
                icon: <Zap className="h-8 w-8" />,
                title: 'Instant QR Codes',
                description: 'Generate facility-specific QR codes for immediate patron feedback collection'
              },
              {
                icon: <Users className="h-8 w-8" />,
                title: 'Team Collaboration',
                description: 'Multi-user organizations with granular permissions and team management'
              },
              {
                icon: <Globe className="h-8 w-8" />,
                title: 'Global Scale',
                description: 'Cloud-hosted infrastructure with auto-scaling and 99.9% uptime SLA'
              }
            ].map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="text-blue-600 mb-2">{feature.icon}</div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 px-4" id="pricing">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-gray-600">Choose the plan that scales with your business</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <Card key={index} className={`relative ${plan.popular ? 'ring-2 ring-blue-500 shadow-xl' : 'shadow-lg'}`}>
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600">
                    Most Popular
                  </Badge>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="text-4xl font-bold text-blue-600">
                    {plan.price}
                    <span className="text-lg text-gray-600">/month</span>
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full" 
                    variant={plan.popular ? 'default' : 'outline'}
                    asChild
                  >
                    <Link href={`/auth/signup?plan=${plan.name.toLowerCase()}`}>
                      Start Free Trial
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Transform Your Facility Management?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join hundreds of organizations using FacilityGuard to improve customer satisfaction 
            and operational efficiency.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-lg px-8" asChild>
              <Link href="/auth/signup">Start Free Trial</Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 text-white border-white hover:bg-white hover:text-blue-600" asChild>
              <Link href="/contact">Talk to Sales</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Building2 className="h-6 w-6" />
                <span className="text-lg font-bold">FacilityGuard</span>
              </div>
              <p className="text-gray-400 text-sm">
                Multi-tenant SaaS platform for modern facility management and customer feedback.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/features">Features</Link></li>
                <li><Link href="/pricing">Pricing</Link></li>
                <li><Link href="/demo">Demo</Link></li>
                <li><Link href="/integrations">Integrations</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/about">About</Link></li>
                <li><Link href="/contact">Contact</Link></li>
                <li><Link href="/support">Support</Link></li>
                <li><Link href="/status">Status</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/privacy">Privacy</Link></li>
                <li><Link href="/terms">Terms</Link></li>
                <li><Link href="/security">Security</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2025 FacilityGuard. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}