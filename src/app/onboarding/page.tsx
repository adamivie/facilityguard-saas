'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Building2, Mail, User, Globe } from 'lucide-react'

interface OnboardingProps {
  searchParams: {
    email?: string
    name?: string
  }
}

export default function OnboardingPage({ searchParams }: OnboardingProps) {
  const router = useRouter()
  const [step, setStep] = useState<'organization' | 'invite'>('organization')
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    organizationName: '',
    slug: '',
    inviteCode: '',
    userEmail: searchParams.email || '',
    userName: searchParams.name || ''
  })

  const handleCreateOrganization = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.organizationName,
          slug: formData.slug,
          userEmail: formData.userEmail,
          userName: formData.userName
        })
      })

      if (response.ok) {
        router.push('/dashboard')
      } else {
        const error = await response.text()
        console.error('Failed to create organization:', error)
      }
    } catch (error) {
      console.error('Error creating organization:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleJoinOrganization = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/organizations/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inviteCode: formData.inviteCode,
          userEmail: formData.userEmail,
          userName: formData.userName
        })
      })

      if (response.ok) {
        router.push('/dashboard')
      } else {
        const error = await response.text()
        console.error('Failed to join organization:', error)
      }
    } catch (error) {
      console.error('Error joining organization:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateSlug = (name: string) => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
    
    setFormData(prev => ({ ...prev, slug }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Welcome to FacilityGuard</CardTitle>
          <CardDescription>
            Let's set up your account. You can create a new organization or join an existing one.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Step Selection */}
          <div className="flex space-x-4">
            <Button
              variant={step === 'organization' ? 'default' : 'outline'}
              onClick={() => setStep('organization')}
              className="flex-1"
            >
              <Building2 className="w-4 h-4 mr-2" />
              Create Organization
            </Button>
            <Button
              variant={step === 'invite' ? 'default' : 'outline'}
              onClick={() => setStep('invite')}
              className="flex-1"
            >
              <Mail className="w-4 h-4 mr-2" />
              Join with Invite
            </Button>
          </div>

          <Separator />

          {step === 'organization' ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="orgName">Organization Name</Label>
                <Input
                  id="orgName"
                  placeholder="Acme Corp"
                  value={formData.organizationName}
                  onChange={(e) => {
                    const value = e.target.value
                    setFormData(prev => ({ ...prev, organizationName: value }))
                    generateSlug(value)
                  }}
                />
              </div>

              <div>
                <Label htmlFor="slug">Organization Slug</Label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                    facilityguard.com/
                  </span>
                  <Input
                    id="slug"
                    className="rounded-l-none"
                    placeholder="acme-corp"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  />
                </div>
              </div>

              <Button 
                onClick={handleCreateOrganization} 
                disabled={!formData.organizationName || !formData.slug || loading}
                className="w-full"
              >
                {loading ? 'Creating...' : 'Create Organization'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="inviteCode">Invite Code</Label>
                <Input
                  id="inviteCode"
                  placeholder="Enter your invite code"
                  value={formData.inviteCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, inviteCode: e.target.value }))}
                />
              </div>

              <Button 
                onClick={handleJoinOrganization}
                disabled={!formData.inviteCode || loading}
                className="w-full"
              >
                {loading ? 'Joining...' : 'Join Organization'}
              </Button>
            </div>
          )}

          <Separator />

          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              Or continue with a different account
            </p>
            <div className="flex space-x-4">
              <Button
                variant="outline"
                onClick={() => signIn('google')}
                className="flex-1"
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </Button>
              <Button
                variant="outline"
                onClick={() => signIn('microsoft-entra-id')}
                className="flex-1"
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zm12.6 0H12.6V0H24v11.4z"/>
                </svg>
                Microsoft
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}