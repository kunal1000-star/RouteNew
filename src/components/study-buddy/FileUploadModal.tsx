// File Upload Modal for Google Drive File Analysis
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileText, Image, File, X, Check, AlertCircle, Download, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface FileAnalysis {
  id: string;
  fileId: string;
  fileName: string;
  analysis: {
    topics: string[];
    concepts: string[];
    difficultyLevel: 'Beginner' | 'Intermediate' | 'Advanced';
    estimatedStudyTime: number;
    aiRecommendations: string[];
    keyInsights: string[];
    subject: string;
    keywords: string[];
    summary: string;
  };
  analysisDate: string;
}

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalysisComplete?: (analysis: FileAnalysis) => void;
}

interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size: string;
  modifiedTime: string;
}

export function FileUploadModal({ isOpen, onClose, onAnalysisComplete }: FileUploadModalProps) {
  const [activeTab, setActiveTab] = useState('drive');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [googleDriveFiles, setGoogleDriveFiles] = useState<GoogleDriveFile[]>([]);
  const [isConnectedToDrive, setIsConnectedToDrive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<GoogleDriveFile | null>(null);
  const [analysisResult, setAnalysisResult] = useState<FileAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check Google Drive connection status
  useEffect(() => {
    if (isOpen) {
      checkGoogleDriveConnection();
    }
  }, [isOpen]);

  const checkGoogleDriveConnection = async () => {
    try {
      // Check if user has Google Drive access token
      const response = await fetch('/api/gdrive/list');
      if (response.ok) {
        setIsConnectedToDrive(true);
        await loadGoogleDriveFiles();
      } else {
        setIsConnectedToDrive(false);
      }
    } catch (error) {
      console.error('Error checking Drive connection:', error);
      setIsConnectedToDrive(false);
    }
  };

  const loadGoogleDriveFiles = async () => {
    try {
      const response = await fetch('/api/gdrive/list');
      if (response.ok) {
        const data = await response.json();
        setGoogleDriveFiles(data.files || []);
      }
    } catch (error) {
      console.error('Error loading Drive files:', error);
    }
  };

  const connectToGoogleDrive = () => {
    // Redirect to Google OAuth
    window.location.href = '/api/gdrive/oauth';
  };

  const analyzeFile = async (file: GoogleDriveFile) => {
    setIsUploading(true);
    setUploadProgress(0);
    setCurrentStep('Starting analysis...');
    setError(null);

    try {
      setCurrentStep('Getting file metadata...');
      setUploadProgress(20);

      const response = await fetch('/api/gdrive/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileId: file.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      setCurrentStep('Extracting content...');
      setUploadProgress(50);

      setCurrentStep('Analyzing with AI...');
      setUploadProgress(75);

      const result = await response.json();
      
      setCurrentStep('Finalizing results...');
      setUploadProgress(100);

      if (result.success) {
        const analysis: FileAnalysis = {
          id: result.analysisId,
          fileId: result.fileId,
          fileName: result.fileName,
          analysis: result.analysis,
          analysisDate: new Date().toISOString(),
        };
        setAnalysisResult(analysis);
        if (onAnalysisComplete) {
          onAnalysisComplete(analysis);
        }
      } else {
        throw new Error(result.error || 'Analysis failed');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      setError(error instanceof Error ? error.message : 'Analysis failed');
    } finally {
      setIsUploading(false);
      setCurrentStep('');
    }
  };

  const resetModal = () => {
    setSelectedFile(null);
    setAnalysisResult(null);
    setError(null);
    setUploadProgress(0);
    setCurrentStep('');
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return <FileText className="h-5 w-5 text-red-500" />;
    if (mimeType.includes('image')) return <Image className="h-5 w-5 text-green-500" />;
    if (mimeType.includes('word') || mimeType.includes('docx')) return <File className="h-5 w-5 text-blue-500" />;
    return <File className="h-5 w-5 text-gray-500" />;
  };

  const formatFileSize = (bytes: string) => {
    const size = parseInt(bytes);
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const addToStudyPlan = (analysis: FileAnalysis) => {
    // This would integrate with the study plan functionality
    console.log('Adding to study plan:', analysis);
    // TODO: Implement study plan integration
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload & Analyze Study Material
          </DialogTitle>
        </DialogHeader>

        {!isConnectedToDrive ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Connect to Google Drive</h3>
            <p className="text-muted-foreground mb-4">
              Connect your Google Drive to easily access and analyze your study materials
            </p>
            <Button onClick={connectToGoogleDrive} className="w-full">
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Connect Google Drive
            </Button>
          </div>
        ) : analysisResult ? (
          // Analysis Results Display
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-green-600">
              <Check className="h-5 w-5" />
              <span className="font-semibold">Analysis Complete!</span>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getFileIcon(analysisResult.analysis.subject.toLowerCase())}
                  {analysisResult.fileName}
                </CardTitle>
                <CardDescription>
                  Analyzed on {new Date(analysisResult.analysisDate).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Summary</h4>
                  <p className="text-sm text-muted-foreground">{analysisResult.analysis.summary}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Topics</h4>
                    <div className="flex flex-wrap gap-1">
                      {analysisResult.analysis.topics.map((topic, index) => (
                        <Badge key={index} variant="secondary">{topic}</Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Key Concepts</h4>
                    <div className="flex flex-wrap gap-1">
                      {analysisResult.analysis.concepts.map((concept, index) => (
                        <Badge key={index} variant="outline">{concept}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{analysisResult.analysis.estimatedStudyTime}</div>
                    <div className="text-sm text-muted-foreground">Minutes</div>
                    <div className="text-xs text-muted-foreground">Study Time</div>
                  </div>
                  
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">{analysisResult.analysis.difficultyLevel}</div>
                    <div className="text-sm text-muted-foreground">Level</div>
                  </div>
                  
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{analysisResult.analysis.subject}</div>
                    <div className="text-sm text-muted-foreground">Subject</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">AI Recommendations</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {analysisResult.analysis.aiRecommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : isUploading ? (
          // Upload Progress Display
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
            <h3 className="text-lg font-semibold mb-2">Analyzing Your File</h3>
            <p className="text-muted-foreground mb-4">{currentStep}</p>
            <Progress value={uploadProgress} className="w-full max-w-md mx-auto" />
            <p className="text-sm text-muted-foreground mt-2">{uploadProgress}% complete</p>
          </div>
        ) : (
          // File Selection Interface
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="drive">Google Drive</TabsTrigger>
              <TabsTrigger value="upload">Upload File</TabsTrigger>
            </TabsList>
            
            <TabsContent value="drive" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Select from Google Drive</h3>
                <Button variant="outline" size="sm" onClick={loadGoogleDriveFiles}>
                  Refresh
                </Button>
              </div>
              
              {googleDriveFiles.length > 0 ? (
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {googleDriveFiles.map((file) => (
                    <div
                      key={file.id}
                      className={`p-3 border rounded-lg cursor-pointer hover:bg-muted transition-colors ${
                        selectedFile?.id === file.id ? 'border-blue-500 bg-blue-50' : ''
                      }`}
                      onClick={() => setSelectedFile(file)}
                    >
                      <div className="flex items-center gap-3">
                        {getFileIcon(file.mimeType)}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{file.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatFileSize(file.size)} • {new Date(file.modifiedTime).toLocaleDateString()}
                          </p>
                        </div>
                        {selectedFile?.id === file.id && (
                          <Check className="h-4 w-4 text-blue-600" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No files found in your Google Drive</p>
                  <p className="text-sm">Supported formats: PDF, DOCX, Images, Text files</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="upload" className="space-y-4">
              <div className="text-center py-8">
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Upload from Device</h3>
                <p className="text-muted-foreground mb-4">
                  Select a file to upload and analyze
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.doc,.txt,.jpg,.jpeg,.png,.gif"
                  className="hidden"
                  onChange={(e) => {
                    // TODO: Implement file upload to Google Drive first
                    console.log('File selected:', e.target.files?.[0]);
                  }}
                />
                <Button onClick={() => fileInputRef.current?.click()}>
                  Choose File
                </Button>
                <p className="text-sm text-muted-foreground mt-2">
                  Supported: PDF, DOCX, Images, Text files
                </p>
              </div>
            </TabsContent>
          </Tabs>
        )}

        {error && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <DialogFooter>
          {analysisResult ? (
            <div className="flex gap-2 w-full">
              <Button variant="outline" onClick={resetModal} className="flex-1">
                Analyze Another File
              </Button>
              <Button onClick={() => addToStudyPlan(analysisResult)} className="flex-1">
                <Plus className="h-4 w-4 mr-2" />
                Add to Study Plan
              </Button>
              <Button variant="ghost" onClick={handleClose}>
                Close
              </Button>
            </div>
          ) : !isUploading ? (
            <div className="flex gap-2 w-full">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={() => selectedFile && analyzeFile(selectedFile)} 
                disabled={!selectedFile}
                className="flex-1"
              >
                <Upload className="h-4 w-4 mr-2" />
                Analyze File
              </Button>
            </div>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
