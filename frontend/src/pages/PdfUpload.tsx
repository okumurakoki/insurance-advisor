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
  Grid,
  Chip,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  PictureAsPdf as PdfIcon,
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

interface UploadResult {
  success: boolean;
  message: string;
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [uploadHistory, setUploadHistory] = useState<UploadHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setError('PDFファイルを選択してください');
        return;
      }
      setSelectedFile(file);
      setError(null);
      setUploadResult(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('ファイルを選択してください');
      return;
    }

    setUploading(true);
    setError(null);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('pdf', selectedFile);

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
        throw new Error(result.message || 'アップロードに失敗しました');
      }

      setUploadResult(result);
      setSelectedFile(null);

      // Refresh upload history
      await fetchUploadHistory();
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'アップロード中にエラーが発生しました');
    } finally {
      setUploading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4, fontWeight: 'bold' }}>
        特別勘定パフォーマンスデータ アップロード
      </Typography>

      {/* Upload Section */}
      <Paper sx={{ p: 4, mb: 4 }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
          保険会社月次PDFアップロード
        </Typography>

        <Box sx={{ mb: 3 }}>
          <input
            accept="application/pdf"
            style={{ display: 'none' }}
            id="pdf-file-input"
            type="file"
            onChange={handleFileSelect}
          />
          <label htmlFor="pdf-file-input">
            <Button
              variant="outlined"
              component="span"
              startIcon={<PdfIcon />}
              sx={{ mr: 2 }}
            >
              PDFを選択
            </Button>
          </label>
          {selectedFile && (
            <Chip
              label={selectedFile.name}
              onDelete={() => setSelectedFile(null)}
              color="primary"
              variant="outlined"
            />
          )}
        </Box>

        {selectedFile && (
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={uploading}
            startIcon={uploading ? <CircularProgress size={20} /> : <UploadIcon />}
            sx={{ mb: 2 }}
          >
            {uploading ? 'アップロード中...' : 'アップロード'}
          </Button>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {uploadResult && uploadResult.success && (
          <Alert severity="success" icon={<SuccessIcon />} sx={{ mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
              アップロード成功
            </Typography>
            {uploadResult.data && (
              <Box>
                <Typography variant="body2">
                  データ日付: {formatDate(uploadResult.data.dataDate)}
                </Typography>
                <Typography variant="body2">
                  会社: {uploadResult.data.companyCode}
                </Typography>
                <Typography variant="body2">
                  処理した勘定数: {uploadResult.data.totalAccounts}
                </Typography>
                <Typography variant="body2">
                  新規作成: {uploadResult.data.newAccountsCreated} 勘定、
                  {uploadResult.data.newPerformanceRecords} パフォーマンスレコード
                </Typography>
                {uploadResult.data.updatedPerformanceRecords > 0 && (
                  <Typography variant="body2">
                    更新: {uploadResult.data.updatedPerformanceRecords} パフォーマンスレコード
                  </Typography>
                )}
              </Box>
            )}
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
            1. 「PDFを選択」ボタンをクリックして、保険会社の月次レポートPDFを選択します
          </Typography>
          <Typography variant="body2" paragraph>
            2. ファイル名が表示されたら、「アップロード」ボタンをクリックします
          </Typography>
          <Typography variant="body2" paragraph>
            3. PDFから自動的に保険会社と特別勘定のパフォーマンスデータが抽出され、データベースに保存されます
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
        </CardContent>
      </Card>
    </Container>
  );
};

export default PdfUpload;
