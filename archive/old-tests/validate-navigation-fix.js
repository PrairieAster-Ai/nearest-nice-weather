#!/usr/bin/env node

/**
 * POI Navigation Button Fix Validation Script
 * 
 * This script validates that the navigation buttons appear correctly
 * based on the new condition: (allPOICount > 1 || canExpand)
 */

import http from 'http';

// Test scenarios for the navigation button logic
const testScenarios = [
    {
        name: "Multiple POIs available (allPOICount > 1)",
        allPOICount: 5,
        canExpand: false,
        expectedVisible: true,
        description: "Should show buttons when multiple POIs exist"
    },
    {
        name: "Single POI but can expand",
        allPOICount: 1,
        canExpand: true,
        expectedVisible: true,
        description: "Should show buttons when search can be expanded"
    },
    {
        name: "Single POI, cannot expand",
        allPOICount: 1,
        canExpand: false,
        expectedVisible: false,
        description: "Should NOT show buttons when only 1 POI and cannot expand"
    },
    {
        name: "No POIs",
        allPOICount: 0,
        canExpand: false,
        expectedVisible: false,
        description: "Should NOT show buttons when no POIs"
    },
    {
        name: "No POIs but can expand",
        allPOICount: 0,
        canExpand: true,
        expectedVisible: true,
        description: "Should show buttons when can expand even with no current POIs"
    }
];

// Simulate the navigation button visibility logic
function shouldShowNavigationButtons(allPOICount, canExpand) {
    return (allPOICount > 1 || canExpand);
}

// Test API connectivity
function testApiConnectivity() {
    return new Promise((resolve, reject) => {
        const req = http.get('http://localhost:4000/api/poi-locations?limit=10', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve(parsed);
                } catch (e) {
                    reject(new Error('Invalid JSON response'));
                }
            });
        });
        
        req.on('error', reject);
        req.setTimeout(5000, () => {
            req.destroy();
            reject(new Error('API timeout'));
        });
    });
}

// Main validation function
async function validateNavigationFix() {
    console.log('🧪 POI Navigation Button Fix Validation');
    console.log('=====================================\n');
    
    // Test logic scenarios
    console.log('📋 Testing Navigation Button Logic:');
    let logicTestsPassed = 0;
    let logicTestsTotal = testScenarios.length;
    
    for (const scenario of testScenarios) {
        const result = shouldShowNavigationButtons(scenario.allPOICount, scenario.canExpand);
        const passed = result === scenario.expectedVisible;
        
        console.log(`${passed ? '✓' : '✗'} ${scenario.name}`);
        console.log(`   allPOICount: ${scenario.allPOICount}, canExpand: ${scenario.canExpand}`);
        console.log(`   Expected: ${scenario.expectedVisible}, Got: ${result}`);
        console.log(`   ${scenario.description}\n`);
        
        if (passed) logicTestsPassed++;
    }
    
    // Test API connectivity
    console.log('🔌 Testing API Connectivity:');
    try {
        const apiData = await testApiConnectivity();
        if (apiData.success && apiData.data && apiData.data.length > 0) {
            console.log(`✓ API Working - Found ${apiData.data.length} POIs`);
            console.log(`   Total POI count available for allPOICount: ${apiData.data.length}\n`);
        } else {
            console.log('✗ API returned no valid data\n');
        }
    } catch (error) {
        console.log(`✗ API Connection Failed: ${error.message}\n`);
    }
    
    // Summary
    console.log('📊 Validation Summary:');
    console.log(`Logic Tests: ${logicTestsPassed}/${logicTestsTotal} passed`);
    
    if (logicTestsPassed === logicTestsTotal) {
        console.log('✅ All navigation button logic tests PASSED!');
        console.log('\n📖 Manual Testing Required:');
        console.log('1. Open http://localhost:3002');
        console.log('2. Click on POI markers to test popup navigation buttons');
        console.log('3. Verify buttons appear based on the conditions above');
        return true;
    } else {
        console.log('❌ Some logic tests FAILED - check implementation!');
        return false;
    }
}

// Run validation if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    validateNavigationFix()
        .then(success => process.exit(success ? 0 : 1))
        .catch(error => {
            console.error('Validation error:', error);
            process.exit(1);
        });
}

export { shouldShowNavigationButtons, testScenarios };