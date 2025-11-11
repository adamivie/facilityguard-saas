'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import FacilityDashboard from '@/components/FacilityDashboard';

export default function DashboardPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to home
  }

  return <FacilityDashboard />;
}
}

const mockUsage = {
  facilities: {
    current: 12,
    limit: 25,
    percentage: 48
  },
  surveys: {
    current: 2847,
    limit: 10000,
    percentage: 28.5
  },
  plan: {
    name: 'Professional',
    price: 99
  }
}

const mockFacilities = [
  { id: 1, name: 'Main Office - Men\'s Restroom', type: 'RESTROOM', rating: 4.6, surveys: 234, issues: 2 },
  { id: 2, name: 'Main Office - Women\'s Restroom', type: 'RESTROOM', rating: 4.8, surveys: 198, issues: 0 },
  { id: 3, name: 'Cafeteria', type: 'KITCHEN', rating: 4.2, surveys: 156, issues: 1 },
  { id: 4, name: 'Lobby Area', type: 'LOBBY', rating: 4.9, surveys: 89, issues: 0 },
]

const mockAnalytics = {
  totalSurveys: 2847,
  avgRating: 4.6,
  issuesReported: 23,
  resolutionTime: '2.4 hours',
  trends: {
    surveys: '+12%',
    rating: '+0.3',
    issues: '-15%'
  }
}

export default function SaaSDashboard() {
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Building2 className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{mockOrganization.name}</h1>
                <p className="text-sm text-gray-500">facilityguard.com/{mockOrganization.slug}</p>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <Crown className="h-3 w-3 mr-1" />
                {mockUsage.plan.name} Plan
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button variant="outline" size="sm">
                <CreditCard className="h-4 w-4 mr-2" />
                Billing
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="px-6 py-6">
        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'facilities', label: 'Facilities' },
                { id: 'analytics', label: 'Analytics' },
                { id: 'usage', label: 'Usage & Billing' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Facilities</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockUsage.facilities.current}</div>
                  <p className="text-xs text-muted-foreground">
                    of {mockUsage.facilities.limit} available
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Surveys This Month</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockAnalytics.totalSurveys}</div>
                  <p className="text-xs text-green-600">
                    {mockAnalytics.trends.surveys} from last month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockAnalytics.avgRating}/5.0</div>
                  <p className="text-xs text-green-600">
                    {mockAnalytics.trends.rating} from last month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Issues</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockAnalytics.issuesReported}</div>
                  <p className="text-xs text-green-600">
                    {mockAnalytics.trends.issues} from last month
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Facility Performance</CardTitle>
                  <CardDescription>Top performing facilities this month</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mockFacilities.slice(0, 3).map((facility) => (
                    <div key={facility.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{facility.name}</p>
                        <p className="text-sm text-gray-500">{facility.surveys} surveys</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center">
                          <span className="font-bold">{facility.rating}/5.0</span>
                        </div>
                        {facility.issues > 0 ? (
                          <Badge variant="destructive" className="text-xs">
                            {facility.issues} issues
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            No issues
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common tasks and shortcuts</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full justify-start" variant="outline">
                    <Building2 className="h-4 w-4 mr-2" />
                    Add New Facility
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <QrCode className="h-4 w-4 mr-2" />
                    Generate QR Codes
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Users className="h-4 w-4 mr-2" />
                    Invite Team Members
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Export Analytics
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'facilities' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Facilities</h2>
              <Button>
                <Building2 className="h-4 w-4 mr-2" />
                Add Facility
              </Button>
            </div>

            <div className="grid gap-4">
              {mockFacilities.map((facility) => (
                <Card key={facility.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="bg-blue-100 p-2 rounded-lg">
                          <Building2 className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{facility.name}</h3>
                          <p className="text-sm text-gray-500">Type: {facility.type}</p>
                        </div>
                      </div>
                      <div className="text-right space-x-4 flex items-center">
                        <div>
                          <p className="font-bold">{facility.rating}/5.0</p>
                          <p className="text-sm text-gray-500">{facility.surveys} surveys</p>
                        </div>
                        <div>
                          {facility.issues > 0 ? (
                            <Badge variant="destructive">
                              {facility.issues} issues
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              No issues
                            </Badge>
                          )}
                        </div>
                        <Button variant="outline" size="sm">
                          <QrCode className="h-4 w-4 mr-2" />
                          QR Code
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Analytics Dashboard</CardTitle>
                <CardDescription>Comprehensive insights into facility performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6 mb-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">{mockAnalytics.totalSurveys}</div>
                    <p className="text-sm text-gray-600">Total Surveys</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">{mockAnalytics.avgRating}/5.0</div>
                    <p className="text-sm text-gray-600">Average Rating</p>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-600">{mockAnalytics.resolutionTime}</div>
                    <p className="text-sm text-gray-600">Avg Resolution Time</p>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <p className="text-gray-600">📊 Advanced analytics charts would be displayed here</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Real-time dashboards, trend analysis, satisfaction scores, and maintenance insights
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'usage' && (
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Plan Usage</CardTitle>
                <CardDescription>Current usage against plan limits</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Facilities</span>
                    <span className="text-sm text-gray-500">
                      {mockUsage.facilities.current} of {mockUsage.facilities.limit}
                    </span>
                  </div>
                  <Progress value={mockUsage.facilities.percentage} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Monthly Surveys</span>
                    <span className="text-sm text-gray-500">
                      {mockUsage.surveys.current} of {mockUsage.surveys.limit}
                    </span>
                  </div>
                  <Progress value={mockUsage.surveys.percentage} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Current Plan</CardTitle>
                <CardDescription>Professional Plan - $99/month</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Plan Status</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Active
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Next Billing</span>
                  <span className="text-sm">December 10, 2025</span>
                </div>
                <div className="space-y-2">
                  <Button className="w-full" variant="outline">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Manage Billing
                  </Button>
                  <Button className="w-full">
                    <Crown className="h-4 w-4 mr-2" />
                    Upgrade Plan
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}