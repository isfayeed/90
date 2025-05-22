// Add error handling to payload loading
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
        window.pld = new Uint32Array(arr);
        console.log('Payload loaded successfully');
        window.payloadLoaded = true;
    } catch (e) {
        console.error(`Error creating payload array: ${e.message}`);
        window.payloadError = e.message;
    }
})
.catch(error => {
    console.error(`Payload loading error: ${error.message}`);
    window.payloadError = error.message;
});