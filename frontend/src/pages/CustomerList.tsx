import React, { useEffect, useState } from 'react';
import {
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Button,
  Box,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Assessment as AssessmentIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { Customer } from '../types';

const CustomerList: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    filterCustomers();
  }, [searchTerm, customers]);

  const fetchCustomers = async () => {
    try {
      const data = await api.getCustomers();
      setCustomers(data);
      setFilteredCustomers(data);
    } catch (err: any) {
      setError('顧客データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const filterCustomers = () => {
    if (!searchTerm) {
      setFilteredCustomers(customers);
      return;
    }

    const filtered = customers.filter(customer =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.includes(searchTerm)
    );
    setFilteredCustomers(filtered);
  };

  const getRiskToleranceLabel = (risk: string) => {
    const labels = {
      conservative: '保守的',
      balanced: 'バランス型',
      aggressive: '積極的',
    };
    return labels[risk as keyof typeof labels] || risk;
  };

  const getRiskToleranceColor = (risk: string): 'info' | 'primary' | 'warning' => {
    const colors = {
      conservative: 'info' as const,
      balanced: 'primary' as const,
      aggressive: 'warning' as const,
    };
    return colors[risk as keyof typeof colors] || 'primary';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="calc(100vh - 200px)">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          顧客一覧
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/customers/new')}
          disabled={customers.length >= (user?.customerLimit || 0)}
        >
          新規顧客登録
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ mb: 2, p: 2 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="顧客名、メールアドレス、電話番号で検索"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell>顧客名</TableCell>
              <TableCell>加入保険会社</TableCell>
              <TableCell>契約日</TableCell>
              <TableCell align="right">月額保険料</TableCell>
              <TableCell>リスク許容度</TableCell>
              <TableCell>連絡先</TableCell>
              <TableCell align="center">操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredCustomers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  {searchTerm ? '検索結果がありません' : '顧客が登録されていません'}
                </TableCell>
              </TableRow>
            ) : (
              filteredCustomers.map((customer) => (
                <TableRow key={customer.id} hover>
                  <TableCell component="th" scope="row">
                    {customer.name}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {customer.displayName || customer.companyName || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {new Date(customer.contractDate).toLocaleDateString('ja-JP')}
                  </TableCell>
                  <TableCell align="right">
                    ¥{customer.monthlyPremium.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getRiskToleranceLabel(customer.riskTolerance)}
                      size="small"
                      color={getRiskToleranceColor(customer.riskTolerance)}
                    />
                  </TableCell>
                  <TableCell>
                    {customer.email && (
                      <Typography variant="body2">{customer.email}</Typography>
                    )}
                    {customer.phone && (
                      <Typography variant="body2">{customer.phone}</Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => navigate(`/customers/${customer.id}`)}
                      title="詳細"
                    >
                      <VisibilityIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => navigate(`/customers/${customer.id}/edit`)}
                      title="編集"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="secondary"
                      onClick={() => navigate(`/analysis/new/${customer.id}`)}
                      title="分析"
                    >
                      <AssessmentIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box mt={2} display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="body2" color="textSecondary">
          顧客数: {filteredCustomers.length} / {user?.customerLimit}
        </Typography>
        {customers.length >= (user?.customerLimit || 0) && (
          <Alert severity="warning" sx={{ mt: 0 }}>
            顧客数が上限に達しています。プランをアップグレードしてください。
          </Alert>
        )}
      </Box>
    </Container>
  );
};

export default CustomerList;