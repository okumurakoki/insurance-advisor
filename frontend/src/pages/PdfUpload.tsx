import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  PictureAsPdf as PdfIcon,
  Delete as DeleteIcon,
  Pending as PendingIcon,
} from '@mui/icons-material';

const API_BASE_URL = (process.env.REACT_APP_API_URL || 'https://api.insurance-optimizer.com').replace(/\/+$/, '');

interface UploadHistory {
  company_code: string;
  company_name: string;
  performance_date: string;
  accounts_count: number;
  records_count: number;
  uploaded_at: string;
}

interface FileUploadStatus {
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  message?: string;
  data?: {
    dataDate: string;
    companyCode: string;
    totalAccounts: number;
    newAccountsCreated: number;
    newPerformanceRecords: number;
    updatedPerformanceRecords: number;
  };
}

const PdfUpload: React.FC = () => {
  const [selectedFiles, setSelectedFiles] = useState<FileUploadStatus[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadHistory, setUploadHistory] = useState<UploadHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });

  useEffect(() => {
    fetchUploadHistory();
  }, []);

  const fetchUploadHistory = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/pdf-upload/history`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('アップロード履歴の取得に失敗しました');
      }

      const result = await response.json();
      setUploadHistory(result.data || []);
    } catch (err) {
      console.error('Error fetching upload history:', err);
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const maxSize = 4 * 1024 * 1024; // 4MB
    const newFiles: FileUploadStatus[] = [];
    const errors: string[] = [];

    Array.from(files).forEach((file) => {
      if (file.type !== 'application/pdf') {
        errors.push(`${file.name}: PDFファイルではありません`);
        return;
      }
      if (file.size > maxSize) {
        errors.push(`${file.name}: ファイルサイズが4MBを超えています (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
        return;
      }
      // Check if already added
      if (selectedFiles.some(f => f.file.name === file.name)) {
        errors.push(`${file.name}: 既に追加されています`);
        return;
      }
      newFiles.push({ file, status: 'pending' });
    });

    if (errors.length > 0) {
      setError(errors.join('\n'));
    } else {
      setError(null);
    }

    if (newFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }

    // Reset input
    event.target.value = '';
  };

  const removeFile = (fileName: string) => {
    setSelectedFiles(prev => prev.filter(f => f.file.name !== fileName));
  };

  const uploadSingleFile = async (fileStatus: FileUploadStatus): Promise<FileUploadStatus> => {
    try {
      const formData = new FormData();
      formData.append('pdf', fileStatus.file);

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/pdf-upload/auto`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          ...fileStatus,
          status: 'error',
          message: result.message || 'アップロードに失敗しました',
        };
      }

      return {
        ...fileStatus,
        status: 'success',
        message: 'アップロード成功',
        data: result.data,
      };
    } catch (err) {
      return {
        ...fileStatus,
        status: 'error',
        message: err instanceof Error ? err.message : 'エラーが発生しました',
      };
    }
  };

  const handleUploadAll = async () => {
    const pendingFiles = selectedFiles.filter(f => f.status === 'pending');
    if (pendingFiles.length === 0) {
      setError('アップロードするファイルがありません');
      return;
    }

    setUploading(true);
    setError(null);
    setUploadProgress({ current: 0, total: pendingFiles.length });

    // Upload files sequentially
    for (let i = 0; i < selectedFiles.length; i++) {
      const fileStatus = selectedFiles[i];
      if (fileStatus.status !== 'pending') continue;

      // Update status to uploading
      setSelectedFiles(prev => prev.map((f, idx) =>
        idx === i ? { ...f, status: 'uploading' as const } : f
      ));

      const result = await uploadSingleFile(fileStatus);

      // Update with result
      setSelectedFiles(prev => prev.map((f, idx) =>
        idx === i ? result : f
      ));

      setUploadProgress(prev => ({ ...prev, current: prev.current + 1 }));
    }

    setUploading(false);
    await fetchUploadHistory();
  };

  const clearCompleted = () => {
    setSelectedFiles(prev => prev.filter(f => f.status === 'pending'));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusIcon = (status: FileUploadStatus['status']) => {
    switch (status) {
      case 'pending':
        return <PendingIcon color="action" />;
      case 'uploading':
        return <CircularProgress size={24} />;
      case 'success':
        return <SuccessIcon color="success" />;
      case 'error':
        return <ErrorIcon color="error" />;
    }
  };

  const pendingCount = selectedFiles.filter(f => f.status === 'pending').length;
  const successCount = selectedFiles.filter(f => f.status === 'success').length;
  const errorCount = selectedFiles.filter(f => f.status === 'error').length;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4, fontWeight: 'bold' }}>
        特別勘定パフォーマンスデータ アップロード
      </Typography>

      {/* Upload Section */}
      <Paper sx={{ p: 4, mb: 4 }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
          保険会社月次PDFアップロード（複数ファイル対応）
        </Typography>

        <Box sx={{ mb: 3 }}>
          <input
            accept="application/pdf"
            style={{ display: 'none' }}
            id="pdf-file-input"
            type="file"
            multiple
            onChange={handleFileSelect}
          />
          <label htmlFor="pdf-file-input">
            <Button
              variant="outlined"
              component="span"
              startIcon={<PdfIcon />}
              sx={{ mr: 2 }}
              disabled={uploading}
            >
              PDFを選択（複数可）
            </Button>
          </label>
          {selectedFiles.length > 0 && (
            <Chip
              label={`${selectedFiles.length}ファイル選択中`}
              color="primary"
              variant="outlined"
            />
          )}
        </Box>

        {/* Selected Files List */}
        {selectedFiles.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle2">
                選択ファイル ({pendingCount}件待機 / {successCount}件成功 / {errorCount}件エラー)
              </Typography>
              {(successCount > 0 || errorCount > 0) && (
                <Button size="small" onClick={clearCompleted}>
                  完了をクリア
                </Button>
              )}
            </Box>
            <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto' }}>
              <List dense>
                {selectedFiles.map((fileStatus, index) => (
                  <ListItem
                    key={fileStatus.file.name}
                    secondaryAction={
                      fileStatus.status === 'pending' && !uploading ? (
                        <IconButton edge="end" onClick={() => removeFile(fileStatus.file.name)}>
                          <DeleteIcon />
                        </IconButton>
                      ) : null
                    }
                  >
                    <ListItemIcon>
                      {getStatusIcon(fileStatus.status)}
                    </ListItemIcon>
                    <ListItemText
                      primary={fileStatus.file.name}
                      secondary={
                        fileStatus.status === 'success' && fileStatus.data
                          ? `${fileStatus.data.companyCode} - ${fileStatus.data.totalAccounts}勘定処理`
                          : fileStatus.status === 'error'
                          ? fileStatus.message
                          : `${(fileStatus.file.size / 1024 / 1024).toFixed(2)}MB`
                      }
                      secondaryTypographyProps={{
                        color: fileStatus.status === 'error' ? 'error' : 'textSecondary'
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Box>
        )}

        {/* Upload Progress */}
        {uploading && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              アップロード中... ({uploadProgress.current} / {uploadProgress.total})
            </Typography>
            <LinearProgress
              variant="determinate"
              value={(uploadProgress.current / uploadProgress.total) * 100}
            />
          </Box>
        )}

        {/* Upload Button */}
        {pendingCount > 0 && (
          <Button
            variant="contained"
            onClick={handleUploadAll}
            disabled={uploading}
            startIcon={uploading ? <CircularProgress size={20} /> : <UploadIcon />}
            sx={{ mb: 2 }}
          >
            {uploading ? 'アップロード中...' : `${pendingCount}件をアップロード`}
          </Button>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2, whiteSpace: 'pre-line' }}>
            {error}
          </Alert>
        )}
      </Paper>

      {/* Upload History */}
      <Paper sx={{ p: 4 }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
          アップロード履歴
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : uploadHistory.length > 0 ? (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>会社</TableCell>
                  <TableCell>データ日付</TableCell>
                  <TableCell align="right">勘定数</TableCell>
                  <TableCell align="right">レコード数</TableCell>
                  <TableCell>アップロード日時</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {uploadHistory.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.company_name}</TableCell>
                    <TableCell>{formatDate(item.performance_date)}</TableCell>
                    <TableCell align="right">{item.accounts_count}</TableCell>
                    <TableCell align="right">{item.records_count}</TableCell>
                    <TableCell>
                      {new Date(item.uploaded_at).toLocaleString('ja-JP')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Alert severity="info">
            アップロード履歴がありません
          </Alert>
        )}
      </Paper>

      {/* Instructions */}
      <Card sx={{ mt: 4, bgcolor: '#f5f5f5' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            使い方
          </Typography>
          <Typography variant="body2" paragraph>
            1. 「PDFを選択」ボタンをクリックして、保険会社の月次レポートPDFを選択します（複数選択可）
          </Typography>
          <Typography variant="body2" paragraph>
            2. 選択したファイルが一覧に表示されます。不要なファイルは削除できます
          </Typography>
          <Typography variant="body2" paragraph>
            3. 「アップロード」ボタンをクリックすると、順番に処理されます
          </Typography>
          <Typography variant="body2" paragraph>
            4. 同じ日付のデータが既に存在する場合は、自動的に更新されます
          </Typography>
          <Typography variant="body2" sx={{ mt: 2, fontWeight: 'bold' }}>
            対応保険会社:
          </Typography>
          <Typography variant="body2" component="div">
            • ソニー生命 変額保険 (full202YMM.pdf)
          </Typography>
          <Typography variant="body2" component="div">
            • ソニー生命 個人年金 SOVANI (sovanifull202YMM.pdf)
          </Typography>
          <Typography variant="body2" component="div">
            • AXA生命 ユニット・リンク (ul_m_YYMM.pdf)
          </Typography>
          <Typography variant="body2" component="div">
            • プルデンシャル生命 変額保険 (データ版_X月.pdf)
          </Typography>
          <Typography variant="body2" component="div">
            • SOMPOひまわり生命 将来のお守り (月次運用レポート)
          </Typography>
          <Typography variant="body2" component="div">
            • はなさく生命 はなさく変額保険 (月次運用レポート)
          </Typography>
        </CardContent>
      </Card>
    </Container>
  );
};

export default PdfUpload;
