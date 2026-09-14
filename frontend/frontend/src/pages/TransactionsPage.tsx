import { useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import { Link as RouterLink } from 'react-router'
import { PageHeader } from '../components/common/PageHeader'
import { RiskLevelChip } from '../components/common/RiskLevelChip'
import { recentTransactions } from '../mocks/dashboardData'
import type { RiskLevel } from '../types'

type RiskFilter = 'ALL' | RiskLevel

const currency = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 })

export function TransactionsPage() {
  const [query, setQuery] = useState('')
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('ALL')

  const normalizedQuery = query.trim().toLowerCase()
  const filteredTransactions = recentTransactions.filter((transaction) => {
    const matchesQuery =
      transaction.id.toLowerCase().includes(normalizedQuery) ||
      transaction.beneficiary.toLowerCase().includes(normalizedQuery) ||
      transaction.country.toLowerCase().includes(normalizedQuery)
    const matchesRisk = riskFilter === 'ALL' || transaction.riskLevel === riskFilter

    return matchesQuery && matchesRisk
  })

  return (
    <Stack spacing={3}>
      <PageHeader
        title="Transactions"
        description="Search payment activity and inspect every automated risk decision."
        action={
          <Button
            component={RouterLink}
            to="/analyze"
            variant="contained"
            startIcon={<AddRoundedIcon />}
          >
            Analyze payment
          </Button>
        }
      />

      <Card>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: { xs: 'stretch', md: 'center' },
              justifyContent: 'space-between',
              flexDirection: { xs: 'column', md: 'row' },
              gap: 2,
              p: 2.5,
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            <TextField
              size="small"
              label="Search"
              placeholder="ID, beneficiary or country"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              sx={{ width: { xs: '100%', md: 340 } }}
            />
            <TextField
              select
              size="small"
              label="Risk level"
              value={riskFilter}
              onChange={(event) => setRiskFilter(event.target.value as RiskFilter)}
              sx={{ width: { xs: '100%', md: 170 } }}
            >
              <MenuItem value="ALL">All levels</MenuItem>
              <MenuItem value="LOW">Low risk</MenuItem>
              <MenuItem value="MEDIUM">Medium risk</MenuItem>
              <MenuItem value="HIGH">High risk</MenuItem>
            </TextField>
          </Box>

          <TableContainer>
            <Table sx={{ minWidth: 920 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Transaction</TableCell>
                  <TableCell>Beneficiary</TableCell>
                  <TableCell>Payment channel</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Risk decision</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Details</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 650 }}>
                        {transaction.id}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {transaction.createdAt}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 550 }}>
                        {transaction.beneficiary}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {transaction.country}
                      </Typography>
                    </TableCell>
                    <TableCell>{transaction.channel}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 650 }}>
                        {transaction.currency} {currency.format(transaction.amount)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                        <RiskLevelChip level={transaction.riskLevel} />
                        <Typography variant="caption" color="text.secondary">
                          {transaction.riskScore}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        variant="outlined"
                        label={transaction.status}
                        color={transaction.status === 'Blocked' ? 'error' : 'default'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        component={RouterLink}
                        to={`/analyses/${transaction.id}`}
                        size="small"
                        endIcon={<ArrowForwardRoundedIcon />}
                      >
                        Open
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {filteredTransactions.length === 0 && (
            <Box sx={{ py: 8, textAlign: 'center' }}>
              <Typography variant="h3">No transactions found</Typography>
              <Typography color="text.secondary" sx={{ mt: 0.75 }}>
                Try another search term or risk filter.
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Stack>
  )
}
