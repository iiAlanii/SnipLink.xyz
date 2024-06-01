const os = require('os');
const fs = require('fs').promises;
const si = require('systeminformation');

async function checkServerLoad() {
    const cpus = os.cpus();
    const totalCores = cpus.length;

    if (cpus.length === 0 || !('times' in cpus[0]) || typeof cpus[0].times !== 'object') {
        console.error('Invalid CPU load data:', cpus);
        return 0;
    }

    const loadPerCore = cpus.reduce((total, cpu) => total + cpu.times.user + cpu.times.sys, 0) / totalCores;
    const cpuLoad = Math.min(loadPerCore * 100, 100);

    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const memoryUsage = ((totalMemory - freeMemory) / totalMemory) * 100;

    const networkStats = await si.networkStats();
    const totalRxSec = networkStats.reduce((total, stats) => total + stats.rx_sec, 0);
    const totalTxSec = networkStats.reduce((total, stats) => total + stats.tx_sec, 0);
    const networkUsage = (totalRxSec + totalTxSec) / 2;

    const stats = await fs.stat('/');

    const diskUsage = (stats.size / stats.blksize) * 100;

    const serverLoad = (cpuLoad + memoryUsage + diskUsage + networkUsage) / 4;
    return serverLoad.toFixed(2);
}

module.exports = { checkServerLoad };