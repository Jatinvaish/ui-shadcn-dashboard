'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Users, Building2, Sparkles, Mail, Phone, User, TrendingUp, Briefcase, DollarSign, UsersRound, LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { AuthService } from '@/lib/api';

interface FormData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  dealFrequency: string;
  followersCount: string;
  staffCount: string;
  creatorsManaged: string;
  yearlyRevenue: string;
  brandStaffCount: string;
  creatorsPartneredMonthly: string;
}

interface UserTypeOption {
  id: 'creator' | 'agency' | 'brand';
  title: string;
  description: string;
  icon: LucideIcon;
  gradient: string;
}

interface StepConfig {
  field: keyof FormData;
  label: string;
  placeholder: string;
  icon: LucideIcon;
  type: 'text' | 'email' | 'tel' | 'number';
}

interface CurrentStepConfig {
  type: 'userTypeSelection' | 'input';
  config?: StepConfig;
}

const OnboardingFlow: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [userType, setUserType] = useState<'creator' | 'agency' | 'brand' | ''>('');
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    dealFrequency: '',
    followersCount: '',
    staffCount: '',
    creatorsManaged: '',
    yearlyRevenue: '',
    brandStaffCount: '',
    creatorsPartneredMonthly: '',
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const userTypes: UserTypeOption[] = [
    {
      id: 'creator',
      title: 'Creator',
      description: 'Individual content creator',
      icon: Sparkles,
      gradient: 'from-purple-500 via-pink-500 to-rose-500'
    },
    {
      id: 'agency',
      title: 'Talent Agency',
      description: 'Manage multiple creators',
      icon: Building2,
      gradient: 'from-blue-500 via-cyan-500 to-teal-500'
    },
    {
      id: 'brand',
      title: 'Brand',
      description: 'Partner with creators',
      icon: Users,
      gradient: 'from-orange-500 via-amber-500 to-yellow-500'
    }
  ];

  const commonSteps: StepConfig[] = [
    { 
      field: 'firstName', 
      label: 'What\'s your first name?', 
      placeholder: 'John',
      icon: User,
      type: 'text'
    },
    { 
      field: 'lastName', 
      label: 'What\'s your last name?', 
      placeholder: 'Doe',
      icon: User,
      type: 'text'
    },
    { 
      field: 'phone', 
      label: 'Contact number', 
      placeholder: '+1 (555) 000-0000',
      icon: Phone,
      type: 'tel'
    },
    { 
      field: 'email', 
      label: 'Your email address', 
      placeholder: 'john@example.com',
      icon: Mail,
      type: 'email'
    },
  ];

  const creatorSteps: StepConfig[] = [
    { 
      field: 'dealFrequency', 
      label: 'How often do you collaborate with brands or campaigns?', 
      placeholder: 'e.g., Weekly, Monthly, Quarterly',
      icon: TrendingUp,
      type: 'text'
    },
    { 
      field: 'followersCount', 
      label: 'How many followers or subscribers do you have?', 
      placeholder: 'e.g., 10,000',
      icon: UsersRound,
      type: 'text'
    },
  ];

  const agencySteps: StepConfig[] = [
    { 
      field: 'staffCount', 
      label: 'How many staff members do you have?', 
      placeholder: 'e.g., 5',
      icon: Briefcase,
      type: 'number'
    },
    { 
      field: 'creatorsManaged', 
      label: 'How many creators do you manage?', 
      placeholder: 'e.g., 20',
      icon: UsersRound,
      type: 'number'
    },
    { 
      field: 'yearlyRevenue', 
      label: 'What is your yearly revenue?', 
      placeholder: 'e.g., $500,000',
      icon: DollarSign,
      type: 'text'
    },
  ];

  const brandSteps: StepConfig[] = [
    { 
      field: 'brandStaffCount', 
      label: 'How many staff members do you have?', 
      placeholder: 'e.g., 10',
      icon: Briefcase,
      type: 'number'
    },
    { 
      field: 'creatorsPartneredMonthly', 
      label: 'How many creators do you partner with each month?', 
      placeholder: 'e.g., 15',
      icon: UsersRound,
      type: 'number'
    },
  ];

  const getTotalSteps = (): number => {
    if (!userType) return 1;
    let total = 1 + commonSteps.length;
    if (userType === 'creator') total += creatorSteps.length;
    if (userType === 'agency') total += agencySteps.length;
    if (userType === 'brand') total += brandSteps.length;
    return total;
  };

  const getCurrentStepConfig = (): CurrentStepConfig | null => {
    if (currentStep === 0) return { type: 'userTypeSelection' };
    
    const adjustedStep = currentStep - 1;
    
    if (adjustedStep < commonSteps.length) {
      return { type: 'input', config: commonSteps[adjustedStep] };
    }
    
    const typeSpecificStep = adjustedStep - commonSteps.length;
    
    if (userType === 'creator' && typeSpecificStep < creatorSteps.length) {
      return { type: 'input', config: creatorSteps[typeSpecificStep] };
    }
    
    if (userType === 'agency' && typeSpecificStep < agencySteps.length) {
      return { type: 'input', config: agencySteps[typeSpecificStep] };
    }
    
    if (userType === 'brand' && typeSpecificStep < brandSteps.length) {
      return { type: 'input', config: brandSteps[typeSpecificStep] };
    }
    
    return null;
  };

  const handleInputChange = (field: keyof FormData, value: string): void => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const validateStep = (): boolean => {
    const stepConfig = getCurrentStepConfig();
    
    if (stepConfig?.type === 'userTypeSelection') {
      if (!userType) {
        setError('Please select who you are');
        return false;
      }
    }
    
    if (stepConfig?.type === 'input' && stepConfig.config) {
      const field = stepConfig.config.field;
      const value = formData[field];
      
      if (!value || value.trim() === '') {
        setError(`Please enter your ${stepConfig.config.label.toLowerCase()}`);
        return false;
      }
      
      if (field === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          setError('Please enter a valid email address');
          return false;
        }
      }
      
      if (field === 'phone') {
        const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/;
        if (!phoneRegex.test(value)) {
          setError('Please enter a valid phone number');
          return false;
        }
      }
    }
    
    setError('');
    return true;
  };

  const handleNext = (): void => {
    if (!validateStep()) return;
    
    if (currentStep < getTotalSteps() - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = (): void => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      setError('');
    }
  };

  const handleSubmit = async (): Promise<void> => {
    if (!validateStep()) return;
    
    setIsSubmitting(true);
    setError('');
    
    try {
      if (userType === 'creator') {
        await AuthService.createCreator({
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          stageName: `${formData.firstName} ${formData.lastName}`,
          bio: `${formData.dealFrequency} collaborations, ${formData.followersCount} followers`,
        });
      } else if (userType === 'agency') {
        await AuthService.createAgency({
          name: `${formData.firstName} ${formData.lastName} Agency`,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          timezone: 'UTC',
          industry: `Staff: ${formData.staffCount}, Creators: ${formData.creatorsManaged}, Revenue: ${formData.yearlyRevenue}`,
        });
      } else if (userType === 'brand') {
        await AuthService.createBrand({
          name: `${formData.firstName} ${formData.lastName} Brand`,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          website: '',
          industry: `Staff: ${formData.brandStaffCount}, Monthly Partnerships: ${formData.creatorsPartneredMonthly}`,
        });
      }
      
      console.log('Onboarding completed successfully');
      
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLastStep = currentStep === getTotalSteps() - 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600">
              Step {currentStep + 1} of {getTotalSteps()}
            </span>
            <span className="text-sm font-medium text-slate-600">
              {Math.round(((currentStep + 1) / getTotalSteps()) * 100)}%
            </span>
          </div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500 ease-out"
              style={{ width: `${((currentStep + 1) / getTotalSteps()) * 100}%` }}
            />
          </div>
        </div>

        <Card className="overflow-hidden border-0 shadow-2xl">
          <div className="grid md:grid-cols-2 min-h-[600px]">
            <div className="p-8 md:p-12 flex flex-col justify-center">
              <div className="space-y-6">
                {currentStep === 0 && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div>
                      <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
                        Who are you?
                      </h1>
                      <p className="text-slate-600">
                        Choose the option that best describes you
                      </p>
                    </div>

                    <div className="space-y-4">
                      {userTypes.map((type) => {
                        const Icon = type.icon;
                        return (
                          <button
                            key={type.id}
                            onClick={() => {
                              setUserType(type.id);
                              setError('');
                            }}
                            className={`w-full p-6 rounded-2xl border-2 transition-all duration-300 text-left group hover:scale-[1.02] ${
                              userType === type.id
                                ? 'border-slate-900 bg-slate-50 shadow-lg'
                                : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                            }`}
                          >
                            <div className="flex items-start gap-4">
                              <div className={`p-3 rounded-xl bg-gradient-to-br ${type.gradient} shadow-lg`}>
                                <Icon className="w-6 h-6 text-white" />
                              </div>
                              <div className="flex-1">
                                <h3 className="text-xl font-semibold text-slate-900 mb-1">
                                  {type.title}
                                </h3>
                                <p className="text-slate-600 text-sm">
                                  {type.description}
                                </p>
                              </div>
                              <div className={`w-6 h-6 rounded-full border-2 transition-all ${
                                userType === type.id
                                  ? 'border-slate-900 bg-slate-900'
                                  : 'border-slate-300'
                              }`}>
                                {userType === type.id && (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <div className="w-2 h-2 bg-white rounded-full" />
                                  </div>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {currentStep > 0 && (() => {
                  const stepConfig = getCurrentStepConfig();
                  if (!stepConfig || stepConfig.type !== 'input' || !stepConfig.config) return null;
                  
                  const { label, placeholder, icon: Icon, field, type } = stepConfig.config;
                  
                  return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div>
                        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
                          {label}
                        </h1>
                        <p className="text-slate-600">
                          Please provide your information
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={field} className="text-slate-700 font-medium">
                          {label}
                        </Label>
                        <div className="relative">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                            <Icon className="w-5 h-5" />
                          </div>
                          <Input
                            id={field}
                            type={type}
                            value={formData[field]}
                            onChange={(e) => handleInputChange(field, e.target.value)}
                            placeholder={placeholder}
                            className="pl-12 h-14 text-lg border-slate-300 focus:border-slate-900 focus:ring-slate-900"
                            autoFocus
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                if (isLastStep) {
                                  handleSubmit();
                                } else {
                                  handleNext();
                                }
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm animate-in fade-in slide-in-from-top-2 duration-300">
                    {error}
                  </div>
                )}

                <div className="flex gap-4 pt-4">
                  {currentStep > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleBack}
                      disabled={isSubmitting}
                      className="h-12 px-6"
                    >
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                  )}
                  
                  {!isLastStep ? (
                    <Button
                      type="button"
                      onClick={handleNext}
                      disabled={isSubmitting}
                      className="flex-1 h-12 bg-slate-900 hover:bg-slate-800"
                    >
                      Continue
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Creating your account...
                        </>
                      ) : (
                        'Complete Setup'
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="hidden md:block bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-12 relative overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500 rounded-full blur-3xl" />
              </div>
              
              <div className="relative z-10 h-full flex flex-col justify-center items-center text-center">
                <div className="space-y-6">
                  {currentStep === 0 && (
                    <>
                      <div className="w-20 h-20 mx-auto bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center">
                        <Sparkles className="w-10 h-10 text-white" />
                      </div>
                      <h2 className="text-3xl font-bold text-white">
                        Welcome to Our Platform
                      </h2>
                      <p className="text-slate-300 max-w-md">
                        Join thousands of creators, agencies, and brands building amazing partnerships
                      </p>
                    </>
                  )}
                  
                  {currentStep > 0 && userType && (
                    <>
                      <div className="w-20 h-20 mx-auto bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center">
                        {(() => {
                          const selectedType = userTypes.find(t => t.id === userType);
                          const Icon = selectedType?.icon;
                          return Icon ? <Icon className="w-10 h-10 text-white" /> : null;
                        })()}
                      </div>
                      <h2 className="text-3xl font-bold text-white capitalize">
                        {userType} Setup
                      </h2>
                      <p className="text-slate-300 max-w-md">
                        We're excited to have you join our community. Just a few more details to get started.
                      </p>
                      <div className="grid grid-cols-3 gap-4 pt-8">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="p-4 bg-white/5 backdrop-blur-xl rounded-xl">
                            <div className="text-2xl font-bold text-white mb-1">
                              {i === 1 ? '10k+' : i === 2 ? '500+' : '99%'}
                            </div>
                            <div className="text-xs text-slate-400">
                              {i === 1 ? 'Users' : i === 2 ? 'Agencies' : 'Satisfaction'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div className="text-center mt-8 text-sm text-slate-600">
          Already have an account?{' '}
          <button className="text-blue-600 hover:text-blue-700 font-medium">
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingFlow;