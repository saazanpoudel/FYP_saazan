const dns = require('dns');

// Set public DNS servers to resolve connection issues with MongoDB Atlas (e.g., ECONNREFUSED/SRV queries)
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (err) {
  console.warn('Warning: Failed to set custom DNS servers:', err.message);
}
