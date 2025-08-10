import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Alert,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  IconButton,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Description as DescriptionIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import api from '../services/api';

const MarketData: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [uploadHistory] = useState([
    {
      id: 1,
      filename: '2024年1月_市場レポート.pdf',
      uploadDate: '2024-01-15',
      status: 'success',
    },
    {
      id: 2,
      filename: '2023年12月_市場レポート.pdf',
      uploadDate: '2023-12-14',
      status: 'success',
    },
  ]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setError('PDFファイルのみアップロード可能です');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('ファイルサイズは10MB以下にしてください');
        return;
      }
      setSelectedFile(file);
      setError('');
      setMessage('');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadProgress(0);
    setError('');
    setMessage('');

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      await api.uploadMarketData(selectedFile);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      setMessage('市場データのアップロードが完了しました');
      setSelectedFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (err: any) {
      setError(err.response?.data?.error || 'アップロードに失敗しました');
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      const event = {
        target: { files: [file] },
      } as any;
      handleFileSelect(event);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        市場データ管理
      </Typography>
      
      <Paper sx={{ p: 4, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          新規データアップロード
        </Typography>
        
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
        
        <Box
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          sx={{
            border: '2px dashed #ccc',
            borderRadius: 2,
            p: 4,
            textAlign: 'center',
            backgroundColor: '#fafafa',
            cursor: 'pointer',
            transition: 'all 0.3s',
            '&:hover': {
              borderColor: '#1976d2',
              backgroundColor: '#f5f5f5',
            },
          }}
        >
          <CloudUploadIcon sx={{ fontSize: 48, color: '#999', mb: 2 }} />
          <Typography variant="body1" gutterBottom>
            PDFファイルをドラッグ＆ドロップまたは
          </Typography>
          <input
            accept="application/pdf"
            style={{ display: 'none' }}
            id="file-upload"
            type="file"
            onChange={handleFileSelect}
          />
          <label htmlFor="file-upload">
            <Button variant="outlined" component="span">
              ファイルを選択
            </Button>
          </label>
          
          {selectedFile && (
            <Box mt={2}>
              <Typography variant="body2" color="textSecondary">
                選択されたファイル: {selectedFile.name}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                サイズ: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </Typography>
            </Box>
          )}
        </Box>
        
        {uploading && (
          <Box mt={2}>
            <LinearProgress variant="determinate" value={uploadProgress} />
            <Typography variant="body2" color="textSecondary" align="center" mt={1}>
              アップロード中... {uploadProgress}%
            </Typography>
          </Box>
        )}
        
        <Box mt={3} display="flex" justifyContent="center">
          <Button
            variant="contained"
            startIcon={<CloudUploadIcon />}
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            size="large"
          >
            アップロード
          </Button>
        </Box>
        
        <Typography variant="caption" color="textSecondary" display="block" mt={2}>
          ※ PDFファイルのみ、最大10MBまでアップロード可能です
        </Typography>
      </Paper>
      
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          アップロード履歴
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        <List>
          {uploadHistory.map((item, index) => (
            <React.Fragment key={item.id}>
              <ListItem
                secondaryAction={
                  <IconButton edge="end" aria-label="delete">
                    <DeleteIcon />
                  </IconButton>
                }
              >
                <ListItemIcon>
                  {item.status === 'success' ? (
                    <CheckCircleIcon color="success" />
                  ) : (
                    <ErrorIcon color="error" />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={item.filename}
                  secondary={`アップロード日: ${new Date(item.uploadDate).toLocaleDateString('ja-JP')}`}
                />
              </ListItem>
              {index < uploadHistory.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
        
        {uploadHistory.length === 0 && (
          <Typography color="textSecondary" align="center">
            まだデータがアップロードされていません
          </Typography>
        )}
      </Paper>
    </Container>
  );
};

export default MarketData;