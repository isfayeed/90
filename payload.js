// Modified payload loading with enhanced safety measures
function loadPayload(retryCount = 0) {
    const maxRetries = 3;
    
    console.log(`Attempting to load payload (attempt ${retryCount + 1}/${maxRetries + 1})...`);
    
    // Create a minimal safe payload in case the real one fails
    window.pld = new Uint32Array(16);
    // Fill with RET instructions (0xC3)
    for (let i = 0; i < window.pld.length; i++) {
        window.pld[i] = 0xC3C3C3C3; // Multiple RET instructions
    }
    window.payloadLoaded = true;
    
    fetch('./payload.bin')
    .then(res => {
        if (!res.ok) {
            console.error(`Failed to fetch payload: ${res.status} ${res.statusText}`);
            throw new Error(`Failed to fetch payload: ${res.status}`);
        }
        return res.arrayBuffer();
    })
    .then(arr => {
        try {
            if (arr.byteLength < 100) {
                throw new Error(`Payload too small: ${arr.byteLength} bytes`);
            }
            
            // Create a safe copy of the payload
            const safePayload = new Uint32Array(arr);
            
            // Verify the payload doesn't start with known problematic patterns
            const isSafe = validatePayload(safePayload);
            
            if (isSafe) {
                window.pld = safePayload;
                console.log(`Payload loaded successfully: ${arr.byteLength} bytes`);
                window.payloadSize = arr.byteLength;
                window.payloadLoaded = true;
            } else {
                console.warn("Payload contains potentially unsafe patterns, using safe fallback");
            }
        } catch (e) {
            console.error(`Error creating payload array: ${e.message}`);
            window.payloadError = e.message;
            
            // Retry if not exceeded max retries
            if (retryCount < maxRetries) {
                console.log(`Retrying payload load in 500ms...`);
                setTimeout(() => loadPayload(retryCount + 1), 500);
            }
        }
    })
    .catch(error => {
        console.error(`Payload loading error: ${error.message}`);
        window.payloadError = error.message;
        
        // Retry if not exceeded max retries
        if (retryCount < maxRetries) {
            console.log(`Retrying payload load in 500ms...`);
            setTimeout(() => loadPayload(retryCount + 1), 500);
        }
    });
}

// Validate payload for safety
function validatePayload(payload) {
    // Check for known problematic patterns
    // This is a simplified check - in a real implementation you would have more comprehensive checks
    
    // Check first few instructions for suspicious patterns
    const suspiciousPatterns = [
        0xFFFFFFFF, // Commonly used in exploits for memory corruption
        0xDEADBEEF, // Debug marker that might indicate untested code
        0xBADCAFE   // Another debug marker
    ];
    
    // Check first 8 instructions for suspicious patterns
    for (let i = 0; i < Math.min(8, payload.length); i++) {
        if (suspiciousPatterns.includes(payload[i])) {
            return false;
        }
    }
    
    // Check payload size is reasonable
    if (payload.length > 1000000) { // Arbitrary large size check
        return false;
    }
    
    // Add more validation as needed
    
    return true;
}

// Start loading payload
loadPayload();