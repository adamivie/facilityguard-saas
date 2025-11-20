'use client';

import { useState, useRef, useEffect } from 'react';
import { ApiClient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  X, 
  Download, 
  Palette, 
  Type, 
  Image as ImageIcon, 
  QrCode,
  Loader2,
  RotateCcw,
  Save
} from 'lucide-react';
import QRCode from 'qrcode';

interface QRCodeDesignerProps {
  isOpen: boolean;
  onClose: () => void;
  facility: {
    id: string;
    name: string;
    type: string;
    description?: string;
  };
}

interface QRDesignOptions {
  // QR Code options
  qrColor: string;
  qrBackground: string;
  qrSize: number;
  qrMargin: number;
  qrPosition: 'top' | 'bottom' | 'left' | 'right' | 'center';
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
  
  // Sign design
  signTitle: string;
  signSubtitle: string;
  signDescription: string;
  titleColor: string;
  subtitleColor: string;
  descriptionColor: string;
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  
  // Typography
  titleFont: string;
  subtitleFont: string;
  descriptionFont: string;
  titleSize: number;
  subtitleSize: number;
  descriptionSize: number;
  titleWeight: string;
  subtitleWeight: string;
  descriptionWeight: string;
  titleAlign: 'left' | 'center' | 'right';
  subtitleAlign: 'left' | 'center' | 'right';
  descriptionAlign: 'left' | 'center' | 'right';
  
  // Layout & Styling
  gradientBackground: boolean;
  gradientColor1: string;
  gradientColor2: string;
  shadowEnabled: boolean;
  roundedCorners: boolean;
  cornerRadius: number;
  headerStyle: 'solid' | 'gradient' | 'none';
  headerColor: string;
  
  // Custom icon/logo
  customIcon: File | null;
  iconSize: number;
  iconPosition: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

export default function QRCodeDesigner({ isOpen, onClose, facility }: QRCodeDesignerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const apiClient = new ApiClient();
  
  const [designOptions, setDesignOptions] = useState<QRDesignOptions>({
    // QR Code defaults
    qrColor: '#000000',
    qrBackground: '#FFFFFF',
    qrSize: 320,
    qrMargin: 20,
    qrPosition: 'center',
    errorCorrectionLevel: 'H',
    
    // Sign design defaults
    signTitle: `${facility.name} Feedback`,
    signSubtitle: 'Scan to Share Your Experience',
    signDescription: 'Help us maintain the highest standards of cleanliness and service. Your feedback enables our maintenance team to respond quickly to issues.',
    titleColor: '#1e40af',
    subtitleColor: '#374151',
    descriptionColor: '#6b7280',
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderWidth: 3,
    
    // Typography defaults - larger sizes for better visibility
    titleFont: 'Arial, sans-serif',
    subtitleFont: 'Arial, sans-serif',
    descriptionFont: 'Arial, sans-serif',
    titleSize: 84,
    subtitleSize: 52,
    descriptionSize: 36,
    titleWeight: 'bold',
    subtitleWeight: 'normal',
    descriptionWeight: 'normal',
    titleAlign: 'center',
    subtitleAlign: 'center',
    descriptionAlign: 'center',
    
    // Layout & Styling defaults
    gradientBackground: false,
    gradientColor1: '#f8fafc',
    gradientColor2: '#e2e8f0',
    shadowEnabled: true,
    roundedCorners: true,
    cornerRadius: 12,
    headerStyle: 'gradient',
    headerColor: '#1e40af',
    
    // Icon defaults
    customIcon: null,
    iconSize: 80,
    iconPosition: 'top',
  });

  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Helper function for rounded rectangles
  const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  };

  // Helper function to adjust brightness
  const adjustBrightness = (color: string, amount: number): string => {
    const hex = color.replace('#', '');
    const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount));
    const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount));
    const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };

  // Text wrapping function
  const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = ctx.measureText(currentLine + " " + word).width;
      if (width < maxWidth) {
        currentLine += " " + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);
    return lines;
  };

  const generatePreview = async () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set balanced DPI for visibility and print quality (8.5x11" at 100 DPI)
    canvas.width = 850;
    canvas.height = 1100;
    canvas.style.width = '400px';
    canvas.style.height = '518px';
    
    ctx.scale(1, 1);
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const margin = 60;
    const contentWidth = canvas.width - (margin * 2);
    const availableHeight = canvas.height - (margin * 2);
    let currentY = margin;
    
    // Calculate space distribution for better layout with larger elements
    const headerHeight = designOptions.headerStyle !== 'none' ? 100 : 0;
    const qrCodeSection = designOptions.qrSize * 1.2 + 60; // QR code + padding (scaled for visibility)
    const remainingSpace = availableHeight - headerHeight - qrCodeSection;
    const textSectionHeight = remainingSpace * 0.7; // 70% for text sections
    const spacingHeight = remainingSpace * 0.3; // 30% for spacing
    
    // Background
    if (designOptions.gradientBackground) {
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, designOptions.gradientColor1);
      gradient.addColorStop(1, designOptions.gradientColor2);
      ctx.fillStyle = gradient;
    } else {
      ctx.fillStyle = designOptions.backgroundColor;
    }
    
    if (designOptions.roundedCorners) {
      roundRect(ctx, 0, 0, canvas.width, canvas.height, designOptions.cornerRadius);
      ctx.fill();
    } else {
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    // Border
    if (designOptions.borderWidth > 0) {
      ctx.strokeStyle = designOptions.borderColor;
      ctx.lineWidth = designOptions.borderWidth;
      if (designOptions.roundedCorners) {
        roundRect(ctx, designOptions.borderWidth / 2, designOptions.borderWidth / 2, 
                 canvas.width - designOptions.borderWidth, canvas.height - designOptions.borderWidth, 
                 designOptions.cornerRadius);
        ctx.stroke();
      } else {
        ctx.strokeRect(designOptions.borderWidth / 2, designOptions.borderWidth / 2, 
                      canvas.width - designOptions.borderWidth, canvas.height - designOptions.borderWidth);
      }
    }
    
    // Header section
    if (designOptions.headerStyle !== 'none') {
      if (designOptions.headerStyle === 'gradient') {
        const headerGradient = ctx.createLinearGradient(0, 0, 0, headerHeight);
        headerGradient.addColorStop(0, designOptions.headerColor);
        headerGradient.addColorStop(1, adjustBrightness(designOptions.headerColor, -40));
        ctx.fillStyle = headerGradient;
      } else {
        ctx.fillStyle = designOptions.headerColor;
      }
      
      if (designOptions.roundedCorners) {
        roundRect(ctx, margin, margin, contentWidth, headerHeight, designOptions.cornerRadius / 2);
      } else {
        ctx.fillRect(margin, margin, contentWidth, headerHeight);
      }
      ctx.fill();
      currentY += headerHeight + (spacingHeight * 0.3);
    }

    // Draw title with enhanced typography
    ctx.fillStyle = designOptions.titleColor;
    ctx.font = `${designOptions.titleWeight} ${designOptions.titleSize}px ${designOptions.titleFont}`;
    ctx.textAlign = designOptions.titleAlign;
    
    // Add shadow for title if enabled
    if (designOptions.shadowEnabled) {
      ctx.shadowColor = 'rgba(0,0,0,0.2)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
    }
    
    const titleX = designOptions.titleAlign === 'center' ? canvas.width / 2 : 
                   designOptions.titleAlign === 'right' ? canvas.width - margin : margin;
    const titleLines = wrapText(ctx, designOptions.signTitle, contentWidth);
    
    // Position title with better spacing
    let titleY;
    if (designOptions.headerStyle !== 'none') {
      titleY = margin + headerHeight / 2 + designOptions.titleSize / 2; // Center in header
    } else {
      titleY = currentY + designOptions.titleSize;
    }
    
    titleLines.forEach((line, index) => {
      ctx.fillText(line, titleX, titleY + (index * (designOptions.titleSize + 12)));
    });
    
    if (designOptions.headerStyle === 'none') {
      currentY += titleLines.length * (designOptions.titleSize + 12) + (spacingHeight * 0.5);
    } else {
      // Title is in header, continue from after header
    }
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Draw subtitle with better spacing
    ctx.fillStyle = designOptions.subtitleColor;
    ctx.font = `${designOptions.subtitleWeight} ${designOptions.subtitleSize}px ${designOptions.subtitleFont}`;
    ctx.textAlign = designOptions.subtitleAlign;
    
    const subtitleX = designOptions.subtitleAlign === 'center' ? canvas.width / 2 : 
                     designOptions.subtitleAlign === 'right' ? canvas.width - margin : margin;
    const subtitleLines = wrapText(ctx, designOptions.signSubtitle, contentWidth);
    subtitleLines.forEach((line, index) => {
      ctx.fillText(line, subtitleX, currentY + (index * (designOptions.subtitleSize + 10)));
    });
    currentY += subtitleLines.length * (designOptions.subtitleSize + 10) + (spacingHeight * 0.4);

    // Calculate QR code position to center it in the middle section
    const qrImg = new Image();
    qrImg.onload = () => {
      const qrDisplaySize = designOptions.qrSize;
      
      // Center QR code vertically in the middle section of the page
      const middleSectionStart = currentY;
      const middleSectionHeight = availableHeight - (currentY - margin) - (textSectionHeight * 0.4);
      const qrY = middleSectionStart + (middleSectionHeight - qrDisplaySize) / 2;
      const qrX = (canvas.width - qrDisplaySize) / 2;
      
      // QR Code background with shadow
      if (designOptions.shadowEnabled) {
        ctx.shadowColor = 'rgba(0,0,0,0.15)';
        ctx.shadowBlur = 15;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 8;
      }
      
      // White background for QR code with better scaling
      ctx.fillStyle = '#ffffff';
      const qrPadding = 40; // Increased padding for better visibility
      const scaledQRSize = qrDisplaySize * 1.4; // Scale QR code for better visibility
      if (designOptions.roundedCorners) {
        roundRect(ctx, qrX - qrPadding, qrY - qrPadding, 
                 scaledQRSize + (qrPadding * 2), scaledQRSize + (qrPadding * 2), 
                 designOptions.cornerRadius / 2);
      } else {
        ctx.fillRect(qrX - qrPadding, qrY - qrPadding, 
                    scaledQRSize + (qrPadding * 2), scaledQRSize + (qrPadding * 2));
      }
      ctx.fill();
      
      // Reset shadow for QR code
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      
      // Draw QR code with better scaling
      const scaledQRX = (canvas.width - scaledQRSize) / 2;
      ctx.drawImage(qrImg, scaledQRX, qrY, scaledQRSize, scaledQRSize);
      
      // Position description at bottom with proper spacing
      const descriptionY = canvas.height - margin - (textSectionHeight * 0.4);
      
      // Draw description at bottom with proper spacing
      ctx.fillStyle = designOptions.descriptionColor;
      ctx.font = `${designOptions.descriptionWeight} ${designOptions.descriptionSize}px ${designOptions.descriptionFont}`;
      ctx.textAlign = designOptions.descriptionAlign;
      
      const descriptionX = designOptions.descriptionAlign === 'center' ? canvas.width / 2 : 
                          designOptions.descriptionAlign === 'right' ? canvas.width - margin : margin;
      const descriptionLines = wrapText(ctx, designOptions.signDescription, contentWidth);
      
      // Position description with adequate line spacing and better visibility
      const lineSpacing = designOptions.descriptionSize * 1.6; // Increased line spacing
      descriptionLines.forEach((line, index) => {
        ctx.fillText(line, descriptionX, descriptionY + (index * lineSpacing));
      });
      
      // Convert canvas to preview URL
      setPreviewUrl(canvas.toDataURL('image/png'));
    };
    
    // Generate QR code
    try {
      const qrDataUrl = await QRCode.toDataURL(
        `https://facilityguard.lineofsightservices.net/survey/${facility.id}`,
        {
          color: {
            dark: designOptions.qrColor,
            light: designOptions.qrBackground,
          },
          margin: designOptions.qrMargin,
          errorCorrectionLevel: designOptions.errorCorrectionLevel,
          width: designOptions.qrSize * 2, // Higher resolution for crisp rendering
        }
      );
      qrImg.src = qrDataUrl;
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      generatePreview();
    }
  }, [isOpen, designOptions, facility.id]);

  const handleIconUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setDesignOptions(prev => ({ ...prev, customIcon: file }));
    }
  };

  const downloadSign = async () => {
    if (!previewUrl) return;
    
    setIsGenerating(true);
    try {
      // Create download link
      const link = document.createElement('a');
      link.download = `${facility.name.replace(/\s+/g, '_')}_QR_Sign.png`;
      link.href = previewUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading sign:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const resetToDefaults = () => {
    setDesignOptions({
      qrColor: '#000000',
      qrBackground: '#FFFFFF',
      qrSize: 240,
      qrMargin: 20,
      qrPosition: 'center',
      errorCorrectionLevel: 'H',
      signTitle: `${facility.name} Feedback`,
      signSubtitle: 'Scan to Share Your Experience',
      signDescription: 'Help us maintain the highest standards of cleanliness and service. Your feedback enables our maintenance team to respond quickly to issues.',
      titleColor: '#1e40af',
      subtitleColor: '#374151',
      descriptionColor: '#6b7280',
      backgroundColor: '#ffffff',
      borderColor: '#e5e7eb',
      borderWidth: 3,
      titleFont: 'Arial, sans-serif',
      subtitleFont: 'Arial, sans-serif',
      descriptionFont: 'Arial, sans-serif',
      titleSize: 52,
      subtitleSize: 32,
      descriptionSize: 24,
      titleWeight: 'bold',
      subtitleWeight: 'normal',
      descriptionWeight: 'normal',
      titleAlign: 'center',
      subtitleAlign: 'center',
      descriptionAlign: 'center',
      gradientBackground: false,
      gradientColor1: '#f8fafc',
      gradientColor2: '#e2e8f0',
      shadowEnabled: true,
      roundedCorners: true,
      cornerRadius: 12,
      headerStyle: 'gradient',
      headerColor: '#1e40af',
      customIcon: null,
      iconSize: 80,
      iconPosition: 'top',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-7xl w-full max-h-[95vh] overflow-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-600">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            QR Code Sign Designer
          </h2>
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-col lg:flex-row">
          {/* Controls Panel */}
          <div className="lg:w-1/3 p-6 border-r border-gray-200 dark:border-gray-600 space-y-6">
            
            {/* QR Code Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <QrCode className="h-5 w-5 mr-2" />
                  QR Code Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="qrColor">QR Color</Label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        id="qrColor"
                        value={designOptions.qrColor}
                        onChange={(e) => setDesignOptions(prev => ({ ...prev, qrColor: e.target.value }))}
                        className="w-12 h-8 rounded border border-gray-300"
                      />
                      <Input
                        value={designOptions.qrColor}
                        onChange={(e) => setDesignOptions(prev => ({ ...prev, qrColor: e.target.value }))}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="qrBackground">Background</Label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        id="qrBackground"
                        value={designOptions.qrBackground}
                        onChange={(e) => setDesignOptions(prev => ({ ...prev, qrBackground: e.target.value }))}
                        className="w-12 h-8 rounded border border-gray-300"
                      />
                      <Input
                        value={designOptions.qrBackground}
                        onChange={(e) => setDesignOptions(prev => ({ ...prev, qrBackground: e.target.value }))}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="qrSize">QR Code Size: {designOptions.qrSize}px</Label>
                  <input
                    type="range"
                    id="qrSize"
                    min="150"
                    max="350"
                    value={designOptions.qrSize}
                    onChange={(e) => setDesignOptions(prev => ({ ...prev, qrSize: parseInt(e.target.value) }))}
                    className="w-full mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="qrPosition">Position on Sign</Label>
                  <select
                    id="qrPosition"
                    value={designOptions.qrPosition}
                    onChange={(e) => setDesignOptions(prev => ({ ...prev, qrPosition: e.target.value as 'top' | 'bottom' | 'left' | 'right' | 'center' }))}
                    className="w-full mt-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="center">Center (Default)</option>
                    <option value="top">Top</option>
                    <option value="bottom">Bottom</option>
                    <option value="left">Left Side</option>
                    <option value="right">Right Side</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="errorLevel">Error Correction</Label>
                  <select
                    id="errorLevel"
                    value={designOptions.errorCorrectionLevel}
                    onChange={(e) => setDesignOptions(prev => ({ ...prev, errorCorrectionLevel: e.target.value as 'L' | 'M' | 'Q' | 'H' }))}
                    className="w-full mt-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="L">Low (7%)</option>
                    <option value="M">Medium (15%)</option>
                    <option value="Q">Quartile (25%)</option>
                    <option value="H">High (30%)</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Text Content */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Type className="h-5 w-5 mr-2" />
                  Sign Content
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="signTitle">Title</Label>
                  <Input
                    id="signTitle"
                    value={designOptions.signTitle}
                    onChange={(e) => setDesignOptions(prev => ({ ...prev, signTitle: e.target.value }))}
                    placeholder="Main heading"
                  />
                </div>
                
                <div>
                  <Label htmlFor="signSubtitle">Subtitle</Label>
                  <Input
                    id="signSubtitle"
                    value={designOptions.signSubtitle}
                    onChange={(e) => setDesignOptions(prev => ({ ...prev, signSubtitle: e.target.value }))}
                    placeholder="Secondary heading"
                  />
                </div>
                
                <div>
                  <Label htmlFor="signDescription">Description</Label>
                  <textarea
                    id="signDescription"
                    value={designOptions.signDescription}
                    onChange={(e) => setDesignOptions(prev => ({ ...prev, signDescription: e.target.value }))}
                    placeholder="Detailed description"
                    rows={4}
                    className="w-full mt-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Typography */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Type className="h-5 w-5 mr-2" />
                  Typography
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Title Typography */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">Title</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="titleFont" className="text-xs">Font</Label>
                      <select
                        id="titleFont"
                        value={designOptions.titleFont}
                        onChange={(e) => setDesignOptions(prev => ({ ...prev, titleFont: e.target.value }))}
                        className="w-full mt-1 p-2 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      >
                        <option value="Arial, sans-serif">Arial</option>
                        <option value="Helvetica, sans-serif">Helvetica</option>
                        <option value="Georgia, serif">Georgia</option>
                        <option value="Times, serif">Times New Roman</option>
                        <option value="Courier, monospace">Courier</option>
                        <option value="Verdana, sans-serif">Verdana</option>
                        <option value="Impact, sans-serif">Impact</option>
                        <option value="Trebuchet MS, sans-serif">Trebuchet MS</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="titleWeight" className="text-xs">Weight</Label>
                      <select
                        id="titleWeight"
                        value={designOptions.titleWeight}
                        onChange={(e) => setDesignOptions(prev => ({ ...prev, titleWeight: e.target.value }))}
                        className="w-full mt-1 p-2 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      >
                        <option value="normal">Normal</option>
                        <option value="bold">Bold</option>
                        <option value="lighter">Light</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="titleSize" className="text-xs">Size: {designOptions.titleSize}px</Label>
                      <input
                        type="range"
                        id="titleSize"
                        min="24"
                        max="72"
                        value={designOptions.titleSize}
                        onChange={(e) => setDesignOptions(prev => ({ ...prev, titleSize: parseInt(e.target.value) }))}
                        className="w-full mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="titleAlign" className="text-xs">Align</Label>
                      <select
                        id="titleAlign"
                        value={designOptions.titleAlign}
                        onChange={(e) => setDesignOptions(prev => ({ ...prev, titleAlign: e.target.value as 'left' | 'center' | 'right' }))}
                        className="w-full mt-1 p-2 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      >
                        <option value="left">Left</option>
                        <option value="center">Center</option>
                        <option value="right">Right</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Subtitle Typography */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">Subtitle</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="subtitleFont" className="text-xs">Font</Label>
                      <select
                        id="subtitleFont"
                        value={designOptions.subtitleFont}
                        onChange={(e) => setDesignOptions(prev => ({ ...prev, subtitleFont: e.target.value }))}
                        className="w-full mt-1 p-2 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      >
                        <option value="Arial, sans-serif">Arial</option>
                        <option value="Helvetica, sans-serif">Helvetica</option>
                        <option value="Georgia, serif">Georgia</option>
                        <option value="Times, serif">Times New Roman</option>
                        <option value="Courier, monospace">Courier</option>
                        <option value="Verdana, sans-serif">Verdana</option>
                        <option value="Impact, sans-serif">Impact</option>
                        <option value="Trebuchet MS, sans-serif">Trebuchet MS</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="subtitleWeight" className="text-xs">Weight</Label>
                      <select
                        id="subtitleWeight"
                        value={designOptions.subtitleWeight}
                        onChange={(e) => setDesignOptions(prev => ({ ...prev, subtitleWeight: e.target.value }))}
                        className="w-full mt-1 p-2 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      >
                        <option value="normal">Normal</option>
                        <option value="bold">Bold</option>
                        <option value="lighter">Light</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="subtitleSize" className="text-xs">Size: {designOptions.subtitleSize}px</Label>
                      <input
                        type="range"
                        id="subtitleSize"
                        min="16"
                        max="48"
                        value={designOptions.subtitleSize}
                        onChange={(e) => setDesignOptions(prev => ({ ...prev, subtitleSize: parseInt(e.target.value) }))}
                        className="w-full mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="subtitleAlign" className="text-xs">Align</Label>
                      <select
                        id="subtitleAlign"
                        value={designOptions.subtitleAlign}
                        onChange={(e) => setDesignOptions(prev => ({ ...prev, subtitleAlign: e.target.value as 'left' | 'center' | 'right' }))}
                        className="w-full mt-1 p-2 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      >
                        <option value="left">Left</option>
                        <option value="center">Center</option>
                        <option value="right">Right</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Description Typography */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">Description</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="descriptionFont" className="text-xs">Font</Label>
                      <select
                        id="descriptionFont"
                        value={designOptions.descriptionFont}
                        onChange={(e) => setDesignOptions(prev => ({ ...prev, descriptionFont: e.target.value }))}
                        className="w-full mt-1 p-2 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      >
                        <option value="Arial, sans-serif">Arial</option>
                        <option value="Helvetica, sans-serif">Helvetica</option>
                        <option value="Georgia, serif">Georgia</option>
                        <option value="Times, serif">Times New Roman</option>
                        <option value="Courier, monospace">Courier</option>
                        <option value="Verdana, sans-serif">Verdana</option>
                        <option value="Impact, sans-serif">Impact</option>
                        <option value="Trebuchet MS, sans-serif">Trebuchet MS</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="descriptionWeight" className="text-xs">Weight</Label>
                      <select
                        id="descriptionWeight"
                        value={designOptions.descriptionWeight}
                        onChange={(e) => setDesignOptions(prev => ({ ...prev, descriptionWeight: e.target.value }))}
                        className="w-full mt-1 p-2 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      >
                        <option value="normal">Normal</option>
                        <option value="bold">Bold</option>
                        <option value="lighter">Light</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="descriptionSize" className="text-xs">Size: {designOptions.descriptionSize}px</Label>
                      <input
                        type="range"
                        id="descriptionSize"
                        min="14"
                        max="32"
                        value={designOptions.descriptionSize}
                        onChange={(e) => setDesignOptions(prev => ({ ...prev, descriptionSize: parseInt(e.target.value) }))}
                        className="w-full mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="descriptionAlign" className="text-xs">Align</Label>
                      <select
                        id="descriptionAlign"
                        value={designOptions.descriptionAlign}
                        onChange={(e) => setDesignOptions(prev => ({ ...prev, descriptionAlign: e.target.value as 'left' | 'center' | 'right' }))}
                        className="w-full mt-1 p-2 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      >
                        <option value="left">Left</option>
                        <option value="center">Center</option>
                        <option value="right">Right</option>
                      </select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Colors & Style */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Palette className="h-5 w-5 mr-2" />
                  Colors & Style
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Text Colors */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">Text Colors</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="titleColor" className="text-xs">Title</Label>
                      <Input
                        type="color"
                        id="titleColor"
                        value={designOptions.titleColor}
                        onChange={(e) => setDesignOptions(prev => ({ ...prev, titleColor: e.target.value }))}
                        className="w-full h-8 cursor-pointer"
                      />
                    </div>
                    <div>
                      <Label htmlFor="subtitleColor" className="text-xs">Subtitle</Label>
                      <Input
                        type="color"
                        id="subtitleColor"
                        value={designOptions.subtitleColor}
                        onChange={(e) => setDesignOptions(prev => ({ ...prev, subtitleColor: e.target.value }))}
                        className="w-full h-8 cursor-pointer"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="descriptionColor" className="text-xs">Description</Label>
                    <Input
                      type="color"
                      id="descriptionColor"
                      value={designOptions.descriptionColor}
                      onChange={(e) => setDesignOptions(prev => ({ ...prev, descriptionColor: e.target.value }))}
                      className="w-full h-8 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Background */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">Background</Label>
                  <div>
                    <Label htmlFor="backgroundColor" className="text-xs">Solid Color</Label>
                    <Input
                      id="backgroundColor"
                      type="color"
                      value={designOptions.backgroundColor}
                      onChange={(e) => setDesignOptions(prev => ({ ...prev, backgroundColor: e.target.value }))}
                      className="w-full h-8 cursor-pointer"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="gradientBackground"
                      checked={designOptions.gradientBackground}
                      onChange={(e) => setDesignOptions(prev => ({ ...prev, gradientBackground: e.target.checked }))}
                      className="rounded"
                    />
                    <Label htmlFor="gradientBackground" className="text-xs">Use Gradient Background</Label>
                  </div>
                  
                  {designOptions.gradientBackground && (
                    <div className="grid grid-cols-2 gap-2 ml-6">
                      <div>
                        <Label htmlFor="gradientColor1" className="text-xs">From</Label>
                        <Input
                          id="gradientColor1"
                          type="color"
                          value={designOptions.gradientColor1}
                          onChange={(e) => setDesignOptions(prev => ({ ...prev, gradientColor1: e.target.value }))}
                          className="w-full h-8 cursor-pointer"
                        />
                      </div>
                      <div>
                        <Label htmlFor="gradientColor2" className="text-xs">To</Label>
                        <Input
                          id="gradientColor2"
                          type="color"
                          value={designOptions.gradientColor2}
                          onChange={(e) => setDesignOptions(prev => ({ ...prev, gradientColor2: e.target.value }))}
                          className="w-full h-8 cursor-pointer"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Border & Effects */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">Border & Effects</Label>
                  <div>
                    <Label htmlFor="borderColor" className="text-xs">Border Color</Label>
                    <Input
                      type="color"
                      id="borderColor"
                      value={designOptions.borderColor}
                      onChange={(e) => setDesignOptions(prev => ({ ...prev, borderColor: e.target.value }))}
                      className="w-full h-8 cursor-pointer"
                    />
                  </div>

                  <div>
                    <Label className="text-xs">Border Width: {designOptions.borderWidth}px</Label>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={designOptions.borderWidth}
                      onChange={(e) => setDesignOptions(prev => ({ ...prev, borderWidth: parseInt(e.target.value) }))}
                      className="w-full mt-1"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="roundedCorners"
                      checked={designOptions.roundedCorners}
                      onChange={(e) => setDesignOptions(prev => ({ ...prev, roundedCorners: e.target.checked }))}
                      className="rounded"
                    />
                    <Label htmlFor="roundedCorners" className="text-xs">Rounded Corners</Label>
                  </div>

                  {designOptions.roundedCorners && (
                    <div className="ml-6">
                      <Label className="text-xs">Corner Radius: {designOptions.cornerRadius}px</Label>
                      <input
                        type="range"
                        min="5"
                        max="30"
                        value={designOptions.cornerRadius}
                        onChange={(e) => setDesignOptions(prev => ({ ...prev, cornerRadius: parseInt(e.target.value) }))}
                        className="w-full mt-1"
                      />
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="shadowEnabled"
                      checked={designOptions.shadowEnabled}
                      onChange={(e) => setDesignOptions(prev => ({ ...prev, shadowEnabled: e.target.checked }))}
                      className="rounded"
                    />
                    <Label htmlFor="shadowEnabled" className="text-xs">Drop Shadow</Label>
                  </div>
                </div>

                {/* Header Style */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">Header Style</Label>
                  <div>
                    <Label htmlFor="headerStyle" className="text-xs">Style</Label>
                    <select
                      id="headerStyle"
                      value={designOptions.headerStyle}
                      onChange={(e) => setDesignOptions(prev => ({ ...prev, headerStyle: e.target.value as 'none' | 'solid' | 'gradient' }))}
                      className="w-full mt-1 p-2 text-xs border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="none">No Header</option>
                      <option value="solid">Solid Header</option>
                      <option value="gradient">Gradient Header</option>
                    </select>
                  </div>
                  
                  {designOptions.headerStyle !== 'none' && (
                    <div>
                      <Label htmlFor="headerColor" className="text-xs">Header Color</Label>
                      <Input
                        id="headerColor"
                        type="color"
                        value={designOptions.headerColor}
                        onChange={(e) => setDesignOptions(prev => ({ ...prev, headerColor: e.target.value }))}
                        className="w-full h-8 cursor-pointer"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Custom Icon */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <ImageIcon className="h-5 w-5 mr-2" />
                  Custom Icon/Logo
                </CardTitle>
                <CardDescription>
                  Upload your company logo or custom icon
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full"
                  >
                    <ImageIcon className="h-4 w-4 mr-2" />
                    {designOptions.customIcon ? 'Change Icon' : 'Upload Icon'}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleIconUpload}
                    className="hidden"
                  />
                </div>
                
                {designOptions.customIcon && (
                  <div>
                    <Label htmlFor="iconSize">Icon Size: {designOptions.iconSize}px</Label>
                    <input
                      type="range"
                      id="iconSize"
                      min="40"
                      max="120"
                      value={designOptions.iconSize}
                      onChange={(e) => setDesignOptions(prev => ({ ...prev, iconSize: parseInt(e.target.value) }))}
                      className="w-full mt-1"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button onClick={downloadSign} className="w-full" disabled={isGenerating || !previewUrl}>
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Download 8.5x11 Sign
                  </>
                )}
              </Button>
              
              <Button variant="outline" onClick={resetToDefaults} className="w-full">
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset to Defaults
              </Button>
            </div>

          </div>

          {/* Preview Panel */}
          <div className="lg:w-2/3 p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  8.5" × 11" Sign Preview
                </h3>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  150 DPI Print Quality
                </div>
              </div>
              
              <div className="flex justify-center">
                <div className="border-2 border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
                  <canvas
                    ref={canvasRef}
                    className="border border-gray-200 dark:border-gray-700 rounded shadow-lg"
                    style={{
                      maxWidth: '400px',
                      maxHeight: '518px',
                      width: '400px',
                      height: '518px'
                    }}
                  />
                </div>
              </div>
              
              <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                Professional quality 8.5" × 11" sign ready for printing
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}