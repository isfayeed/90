// Add error handling and retry mechanism to payload loading
function loadPayload(retryCount = 0) {
    const maxRetries = 3;
    
    console.log(`Attempting to load payload (attempt ${retryCount + 1}/${maxRetries + 1})...`);
    
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
            
            window.pld = new Uint32Array(arr);
            console.log(`Payload loaded successfully: ${arr.byteLength} bytes`);
            window.payloadLoaded = true;
            window.payloadSize = arr.byteLength;
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

// Start loading payload
loadPayload();