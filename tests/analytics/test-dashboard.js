/**
 * Test Analytics Dashboard
 * Real-time test monitoring and reporting
 */

import express from 'express';
import fs from 'fs';
import path from 'path';
import { testMetrics } from './test-metrics.js';

const app = express();
const PORT = process.env.TEST_DASHBOARD_PORT || 3060;

// Serve static files
app.use(express.static(path.join(process.cwd(), 'test-results')));

// API endpoints
app.get('/api/metrics/latest', (req, res) => {
  try {
    const latestPath = path.join('test-results', 'latest.json');
    if (fs.existsSync(latestPath)) {
      const data = JSON.parse(fs.readFileSync(latestPath, 'utf8'));
      res.json(data);
    } else {
      res.json({ error: 'No test data available' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/metrics/history', (req, res) => {
  try {
    const resultsDir = 'test-results';
    if (!fs.existsSync(resultsDir)) {
      return res.json([]);
    }
    
    const files = fs.readdirSync(resultsDir)
      .filter(file => file.startsWith('test-metrics-') && file.endsWith('.json'))
      .sort()
      .slice(-10); // Last 10 runs
    
    const history = files.map(file => {
      const data = JSON.parse(fs.readFileSync(path.join(resultsDir, file), 'utf8'));
      return {
        filename: file,
        timestamp: data.timestamp,
        summary: data.summary
      };
    });
    
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/metrics/live', (req, res) => {
  res.json(testMetrics.generateSummary());
});

// Dashboard HTML
app.get('/', (req, res) => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Analytics Dashboard</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background: #f5f5f5; }
        .dashboard { max-width: 1400px; margin: 0 auto; padding: 20px; }
        .header { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 20px; }
        .metric-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .metric-value { font-size: 2.5em; font-weight: bold; }
        .metric-label { color: #6b7280; margin-top: 5px; }
        .chart-container { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 20px; }
        .pass { color: #10b981; }
        .fail { color: #ef4444; }
        .loading { color: #f59e0b; }
        .refresh-btn { background: #3b82f6; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; }
        .refresh-btn:hover { background: #2563eb; }
        .status-indicator { display: inline-block; width: 12px; height: 12px; border-radius: 50%; margin-right: 8px; }
        .status-running { background: #f59e0b; }
        .status-passed { background: #10b981; }
        .status-failed { background: #ef4444; }
        .history-item { padding: 10px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; }
        .trend-up { color: #10b981; }
        .trend-down { color: #ef4444; }
    </style>
</head>
<body>
    <div class="dashboard">
        <div class="header">
            <h1>Test Analytics Dashboard</h1>
            <p>Real-time monitoring of test performance and metrics</p>
            <button class="refresh-btn" onclick="refreshData()">Refresh Data</button>
            <span id="last-update"></span>
        </div>
        
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-value" id="total-tests">-</div>
                <div class="metric-label">Total Tests</div>
            </div>
            <div class="metric-card">
                <div class="metric-value pass" id="passed-tests">-</div>
                <div class="metric-label">Passed</div>
            </div>
            <div class="metric-card">
                <div class="metric-value fail" id="failed-tests">-</div>
                <div class="metric-label">Failed</div>
            </div>
            <div class="metric-card">
                <div class="metric-value" id="pass-rate">-</div>
                <div class="metric-label">Pass Rate</div>
            </div>
            <div class="metric-card">
                <div class="metric-value" id="avg-duration">-</div>
                <div class="metric-label">Avg Duration (ms)</div>
            </div>
            <div class="metric-card">
                <div class="metric-value" id="total-duration">-</div>
                <div class="metric-label">Total Time (s)</div>
            </div>
        </div>
        
        <div class="chart-container">
            <h2>Test History</h2>
            <div id="history-chart">Loading history...</div>
        </div>
        
        <div class="chart-container">
            <h2>Recent Failures</h2>
            <div id="failures-list">No recent failures</div>
        </div>
        
        <div class="chart-container">
            <h2>Performance Trends</h2>
            <div id="performance-trends">No performance data</div>
        </div>
    </div>
    
    <script>
        let refreshInterval;
        
        async function fetchLatestMetrics() {
            try {
                const response = await fetch('/api/metrics/latest');
                const data = await response.json();
                updateDashboard(data);
                return data;
            } catch (error) {
                console.error('Failed to fetch metrics:', error);
                return null;
            }
        }
        
        async function fetchHistory() {
            try {
                const response = await fetch('/api/metrics/history');
                const history = await response.json();
                updateHistoryChart(history);
                return history;
            } catch (error) {
                console.error('Failed to fetch history:', error);
                return [];
            }
        }
        
        function updateDashboard(data) {
            if (!data || data.error) {
                document.getElementById('total-tests').textContent = 'No Data';
                return;
            }
            
            const summary = data.summary || {};
            
            document.getElementById('total-tests').textContent = summary.totalTests || 0;
            document.getElementById('passed-tests').textContent = summary.passedTests || 0;
            document.getElementById('failed-tests').textContent = summary.failedTests || 0;
            document.getElementById('pass-rate').textContent = (summary.passRate || 0) + '%';
            document.getElementById('avg-duration').textContent = summary.avgDuration || 0;
            document.getElementById('total-duration').textContent = Math.round((summary.totalDuration || 0) / 1000);
            
            // Update failures
            const failuresList = document.getElementById('failures-list');
            if (data.failures && data.failures.length > 0) {
                failuresList.innerHTML = data.failures.map(failure => 
                    '<div class="history-item">' +
                    '<span><span class="status-indicator status-failed"></span>' + failure.suite + ' › ' + failure.name + '</span>' +
                    '<span>' + (failure.error || 'No error message') + '</span>' +
                    '</div>'
                ).join('');
            } else {
                failuresList.innerHTML = '<p style="color: #10b981;">No recent failures ✓</p>';
            }
            
            // Update performance trends
            const performanceTrends = document.getElementById('performance-trends');
            if (data.performance && Object.keys(data.performance).length > 0) {
                performanceTrends.innerHTML = Object.entries(data.performance).map(([metric, values]) => {
                    const avg = (values.reduce((acc, v) => acc + v.value, 0) / values.length).toFixed(2);
                    const min = Math.min(...values.map(v => v.value));
                    const max = Math.max(...values.map(v => v.value));
                    return '<div class="history-item">' +
                           '<span><strong>' + metric + '</strong></span>' +
                           '<span>Avg: ' + avg + ', Range: ' + min + '-' + max + '</span>' +
                           '</div>';
                }).join('');
            } else {
                performanceTrends.innerHTML = '<p>No performance data available</p>';
            }
            
            document.getElementById('last-update').textContent = 'Last updated: ' + new Date().toLocaleTimeString();
        }
        
        function updateHistoryChart(history) {
            const historyChart = document.getElementById('history-chart');
            
            if (!history || history.length === 0) {
                historyChart.innerHTML = '<p>No historical data available</p>';
                return;
            }
            
            historyChart.innerHTML = history.slice(-5).map((run, index) => {
                const summary = run.summary;
                const passRate = summary.passRate || 0;
                const statusClass = passRate >= 90 ? 'status-passed' : passRate >= 70 ? 'status-running' : 'status-failed';
                
                return '<div class="history-item">' +
                       '<span><span class="status-indicator ' + statusClass + '"></span>' + new Date(run.timestamp).toLocaleString() + '</span>' +
                       '<span>' + summary.totalTests + ' tests, ' + passRate + '% pass rate</span>' +
                       '</div>';
            }).join('');
        }
        
        function refreshData() {
            fetchLatestMetrics();
            fetchHistory();
        }
        
        function startAutoRefresh() {
            refreshInterval = setInterval(refreshData, 5000); // Refresh every 5 seconds
        }
        
        function stopAutoRefresh() {
            if (refreshInterval) {
                clearInterval(refreshInterval);
            }
        }
        
        // Initialize dashboard
        document.addEventListener('DOMContentLoaded', function() {
            refreshData();
            startAutoRefresh();
        });
        
        // Stop refresh when page is not visible
        document.addEventListener('visibilitychange', function() {
            if (document.hidden) {
                stopAutoRefresh();
            } else {
                startAutoRefresh();
            }
        });
    </script>
</body>
</html>
  `;
  
  res.send(html);
});

export function startTestDashboard() {
  return new Promise((resolve) => {
    const server = app.listen(PORT, () => {
      console.log(`Test Dashboard running at http://localhost:${PORT}`);
      resolve(server);
    });
  });
}

export { app as testDashboard };

// CLI runner
if (import.meta.url === `file://${process.argv[1]}`) {
  startTestDashboard().then(() => {
    console.log('Dashboard started successfully');
  }).catch(error => {
    console.error('Failed to start dashboard:', error);
    process.exit(1);
  });
}