import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import api from '../services/api';
import { CustomerForm as CustomerFormType, Customer } from '../types';

const CustomerForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [formData, setFormData] = useState<CustomerFormType>({
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
  const [fetchingCustomer, setFetchingCustomer] = useState(isEditMode);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isEditMode && id) {
      fetchCustomer(parseInt(id));
    }
  }, [isEditMode, id]);

  const fetchCustomer = async (customerId: number) => {
    try {
      const customer = await api.getCustomer(customerId);
      setFormData({
        name: customer.name,
        email: customer.email || '',
        phone: customer.phone || '',
        contractDate: customer.contractDate,
        contractAmount: customer.contractAmount,
        monthlyPremium: customer.monthlyPremium,
        riskTolerance: customer.riskTolerance,
        investmentGoal: customer.investmentGoal || '',
        notes: customer.notes || '',
      });
    } catch (err: any) {
      setError('顧客情報の取得に失敗しました');
    } finally {
      setFetchingCustomer(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isEditMode && id) {
        await api.updateCustomer(parseInt(id), formData);
        setSuccess('顧客情報を更新しました');
      } else {
        const result = await api.createCustomer(formData);
        setSuccess('顧客を登録しました');
        setTimeout(() => {
          navigate(`/customers/${result.id}`);
        }, 1500);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || '操作に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof CustomerFormType, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  if (fetchingCustomer) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="calc(100vh - 200px)">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {isEditMode ? '顧客情報編集' : '新規顧客登録'}
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="顧客名"
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
                label="契約金額"
                value={formData.contractAmount}
                onChange={(e) => handleChange('contractAmount', parseFloat(e.target.value) || 0)}
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
                label="月額保険料"
                value={formData.monthlyPremium}
                onChange={(e) => handleChange('monthlyPremium', parseFloat(e.target.value) || 0)}
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
              variant="outlined"
              onClick={() => navigate('/customers')}
              disabled={loading}
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading || !formData.name || !formData.contractAmount || !formData.monthlyPremium}
            >
              {loading ? <CircularProgress size={24} /> : (isEditMode ? '更新' : '登録')}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default CustomerForm;