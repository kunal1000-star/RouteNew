// File Clustering API Endpoint
// ============================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { fileEmbeddingService } from '@/lib/ai/file-embedding-service';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { numberOfClusters, minFilesPerCluster = 2 } = await request.json();

    if (numberOfClusters && (numberOfClusters < 2 || numberOfClusters > 20)) {
      return NextResponse.json({ 
        error: 'Number of clusters must be between 2 and 20' 
      }, { status: 400 });
    }

    // Perform clustering
    const clusters = await fileEmbeddingService.clusterFilesByTopics(
      session.user.id, 
      numberOfClusters || 5
    );

    // Filter out clusters with too few files
    const filteredClusters = clusters.filter(cluster => 
      cluster.fileCount >= minFilesPerCluster
    );

    // Format clusters for frontend
    const formattedClusters = filteredClusters.map(cluster => ({
      id: cluster.id,
      name: cluster.name,
      description: cluster.description,
      topic: cluster.topic,
      fileCount: cluster.fileCount,
      files: cluster.files.map(file => ({
        id: file.id,
        fileId: file.file_id,
        fileName: file.file_name,
        fileType: file.file_type,
        subject: file.subject,
        topics: file.topics || [],
        summary: file.summary || '',
        analysisDate: file.created_at
      }))
    }));

    return NextResponse.json({
      success: true,
      clusters: formattedClusters,
      totalClusters: formattedClusters.length,
      clusteringMetadata: {
        totalFiles: formattedClusters.reduce((sum, c) => sum + c.fileCount, 0),
        algorithm: 'kmeans',
        dimensions: 1536,
        timestamp: new Date().toISOString(),
        parameters: {
          numberOfClusters: numberOfClusters || 5,
          minFilesPerCluster
        }
      }
    });

  } catch (error: any) {
    console.error('File clustering error:', error);
    
    return NextResponse.json({
      error: 'File clustering failed',
      details: error.message
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const clusterId = searchParams.get('clusterId');
    const numberOfClusters = parseInt(searchParams.get('clusters') || '5');

    if (clusterId) {
      // Get specific cluster details
      const clusters = await fileEmbeddingService.clusterFilesByTopics(
        session.user.id, 
        numberOfClusters
      );
      
      const cluster = clusters.find(c => c.id === clusterId);
      
      if (!cluster) {
        return NextResponse.json({ error: 'Cluster not found' }, { status: 404 });
      }

      const formattedCluster = {
        id: cluster.id,
        name: cluster.name,
        description: cluster.description,
        topic: cluster.topic,
        fileCount: cluster.fileCount,
        files: cluster.files.map(file => ({
          id: file.id,
          fileId: file.file_id,
          fileName: file.file_name,
          fileType: file.file_type,
          subject: file.subject,
          topics: file.topics || [],
          summary: file.summary || '',
          analysisDate: file.created_at
        }))
      };

      return NextResponse.json({
        success: true,
        cluster: formattedCluster
      });
    } else {
      // Get all clusters
      const clusters = await fileEmbeddingService.clusterFilesByTopics(
        session.user.id, 
        numberOfClusters
      );

      const formattedClusters = clusters.map(cluster => ({
        id: cluster.id,
        name: cluster.name,
        description: cluster.description,
        topic: cluster.topic,
        fileCount: cluster.fileCount,
        sampleFiles: cluster.files.slice(0, 3).map(file => ({
          id: file.id,
          fileName: file.file_name,
          subject: file.subject
        }))
      }));

      return NextResponse.json({
        success: true,
        clusters: formattedClusters,
        totalClusters: formattedClusters.length
      });
    }

  } catch (error: any) {
    console.error('File clustering GET error:', error);
    
    return NextResponse.json({
      error: 'File clustering failed',
      details: error.message
    }, { status: 500 });
  }
}