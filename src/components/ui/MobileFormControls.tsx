'use client';

import React, { useState } from 'react';
import { Button } from './button';
import { Input } from './input';
import { Textarea } from './textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Checkbox } from './checkbox';
import { RadioGroup, RadioGroupItem } from './radio-group';
import { Switch } from './switch';
import { Slider } from './slider';
import { Label } from './label';
import { Card } from './card';
import { 
  Smartphone, 
  User, 
  Mail, 
  Calendar,
  Settings,
  Save,
  ToggleRight,
  CheckSquare,
  Radio,
  Ruler
} from 'lucide-react';

export function MobileFormControls() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: '',
    preference: '',
    notifications: false,
    theme: 'light',
    volume: 50,
    rememberMe: false
  });

  const [selectedOption, setSelectedOption] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    alert('Form submitted successfully!');
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const options = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' },
    { value: 'option4', label: 'Option 4' }
  ];

  return (
    <Card className="p-6 space-y-6 max-w-md mx-auto">
      <div className="text-center">
        <Smartphone className="h-8 w-8 text-blue-600 mx-auto mb-2" />
        <h2 className="text-xl font-semibold">Mobile-Optimized Form Controls</h2>
        <p className="text-sm text-muted-foreground">
          All controls optimized for Android touch interaction
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Text Inputs */}
        <div className="space-y-2">
          <Label htmlFor="name" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Full Name
          </Label>
          <Input
            id="name"
            placeholder="Enter your full name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email Address
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="your.email@example.com"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Bio
          </Label>
          <Textarea
            id="bio"
            placeholder="Tell us about yourself..."
            value={formData.bio}
            onChange={(e) => handleInputChange('bio', e.target.value)}
            className="min-h-[100px]"
          />
        </div>

        {/* Select */}
        <div className="space-y-2">
          <Label htmlFor="preference" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Preference
          </Label>
          <Select onValueChange={setSelectedOption} value={selectedOption}>
            <SelectTrigger>
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Checkboxes */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4" />
            Notifications
          </Label>
          <div className="space-y-2">
            <label className="flex items-center space-x-3 cursor-pointer">
              <Checkbox
                checked={formData.notifications}
                onCheckedChange={(checked) => handleInputChange('notifications', checked)}
              />
              <span>Email notifications</span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer">
              <Checkbox />
              <span>Push notifications</span>
            </label>
            <label className="flex items-center space-x-3 cursor-pointer">
              <Checkbox />
              <span>SMS notifications</span>
            </label>
          </div>
        </div>

        {/* Radio Buttons */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Radio className="h-4 w-4" />
            Theme Selection
          </Label>
          <RadioGroup
            value={formData.theme}
            onValueChange={(value) => handleInputChange('theme', value)}
          >
            <div className="space-y-2">
              <label className="flex items-center space-x-3 cursor-pointer">
                <RadioGroupItem value="light" id="light" />
                <span>Light Theme</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <RadioGroupItem value="dark" id="dark" />
                <span>Dark Theme</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer">
                <RadioGroupItem value="auto" id="auto" />
                <span>Auto Theme</span>
              </label>
            </div>
          </RadioGroup>
        </div>

        {/* Switch */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ToggleRight className="h-4 w-4" />
            <span>Remember Me</span>
          </div>
          <Switch
            checked={formData.rememberMe}
            onCheckedChange={(checked) => handleInputChange('rememberMe', checked)}
          />
        </div>

        {/* Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <Ruler className="h-4 w-4" />
              Volume Level
            </Label>
            <span className="text-sm font-medium">{formData.volume}%</span>
          </div>
          <Slider
            value={[formData.volume]}
            onValueChange={(value) => handleInputChange('volume', value[0])}
            min={0}
            max={100}
            step={1}
          />
        </div>

        {/* Submit Button */}
        <Button type="submit" className="w-full h-12 text-base">
          <Save className="h-4 w-4 mr-2" />
          Save Preferences
        </Button>
      </form>

      {/* Touch Target Verification */}
      <div className="mt-6 p-4 bg-muted/50 rounded-lg">
        <h4 className="font-medium mb-2">Touch Target Compliance</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 bg-green-500 rounded"></div>
            <span>44px+ inputs</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 bg-green-500 rounded"></div>
            <span>24px+ checkboxes</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 bg-green-500 rounded"></div>
            <span>36px+ switches</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 bg-green-500 rounded"></div>
            <span>28px+ sliders</span>
          </div>
        </div>
      </div>
    </Card>
  );
}