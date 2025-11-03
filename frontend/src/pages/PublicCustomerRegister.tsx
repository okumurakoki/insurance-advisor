import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Grid,
  MenuItem,
  Alert,
  CircularProgress,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ja from 'date-fns/locale/ja';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const PublicCustomerRegister: React.FC = () => {
  const [formData, setFormData] = useState({
    staffId: '',
    name: '',
    email: '',
    phone: '',
    contractDate: new Date().toISOString().split('T')[0],
    contractAmount: 0,
    monthlyPremium: 0,
    riskTolerance: 'balanced',
    investmentGoal: '',
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/customers/public/register`, formData);
      setSuccess(response.data.message || '登録が完了しました。担当者からご連絡いたします。');

      // フォームをリセット
      setFormData({
        staffId: '',
        name: '',
        email: '',
        phone: '',
        contractDate: new Date().toISOString().split('T')[0],
        contractAmount: 0,
        monthlyPremium: 0,
        riskTolerance: 'balanced',
        investmentGoal: '',
        notes: '',
      });
    } catch (err: any) {
      setError(err.response?.data?.error || '登録に失敗しました。もう一度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          顧客登録フォーム
        </Typography>

        <Typography variant="body1" sx={{ mb: 3 }}>
          担当者から提供された担当者IDを入力して、ご登録ください。
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="担当者ID"
                value={formData.staffId}
                onChange={(e) => handleChange('staffId', e.target.value)}
                helperText="担当者から提供された数字のIDを入力してください"
                type="number"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="お名前"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ja}>
                <DatePicker
                  label="契約日"
                  value={new Date(formData.contractDate)}
                  onChange={(date) => handleChange('contractDate', date?.toISOString().split('T')[0])}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                    },
                  }}
                />
              </LocalizationProvider>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="email"
                label="メールアドレス"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="電話番号"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                type="number"
                label="契約金額（総額）"
                value={formData.contractAmount}
                onChange={(e) => handleChange('contractAmount', parseFloat(e.target.value) || 0)}
                helperText="変額保険の契約総額を入力してください"
                InputProps={{
                  startAdornment: '¥',
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                type="number"
                label="月額保険料（毎月）"
                value={formData.monthlyPremium}
                onChange={(e) => handleChange('monthlyPremium', parseFloat(e.target.value) || 0)}
                helperText="毎月支払う保険料を入力してください"
                InputProps={{
                  startAdornment: '¥',
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                select
                label="リスク許容度"
                value={formData.riskTolerance}
                onChange={(e) => handleChange('riskTolerance', e.target.value)}
              >
                <MenuItem value="conservative">保守的</MenuItem>
                <MenuItem value="balanced">バランス型</MenuItem>
                <MenuItem value="aggressive">積極的</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="投資目標"
                value={formData.investmentGoal}
                onChange={(e) => handleChange('investmentGoal', e.target.value)}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="備考"
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              type="submit"
              variant="contained"
              disabled={
                loading ||
                !formData.staffId ||
                !formData.name ||
                !formData.contractAmount ||
                !formData.monthlyPremium
              }
              fullWidth
            >
              {loading ? <CircularProgress size={24} /> : '登録する'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default PublicCustomerRegister;
