const net = require('net');
const server = net.createServer();
const proxy_port = 9000;
let server_port = 80;

server.on("connection", (client_to_proxy) => {
    client_to_proxy.once("data", (data) => {
        let is_tls_connect = (data.toString().indexOf("CONNECT")) !== -1 ? true : false;
        let server_address = data.toString();
        let proxy_to_web_server;

        if (is_tls_connect) {
            server_port = 443;
            server_address = server_address.split("CONNECT")[1].trim().split(":")[0];
        } else {
            server_address = server_address.split("Host: ")[1].split("\r\n")[0];
            console.log(server_address)
        }
        proxy_to_web_server = net.createConnection({
            host: server_address,
            port: server_port
        }, () => {
            console.log("Proxy is up");
            if (is_tls_connect) {
                client_to_proxy.write('HTTP/1.1 200 OK\r\n\n');
            } else {
                proxy_to_web_server.write(data);
            }
            client_to_proxy.pipe(proxy_to_web_server);
            proxy_to_web_server.pipe(client_to_proxy);
            proxy_to_web_server.on('error', (err) => {
                console.log(`proxy to server error: ${err}`);
            });
        });
        client_to_proxy.on('error', err => {
            console.log(`client to proxy error: ${err}`);
        });
    })
})

server.on('close', () => {
    console.log('Client Disconnected');
});

server.on('error', (err) => {
    console.log(`Server error: ${err}`);
});

server.listen(proxy_port, () => console.log(`Proxy connected on localhost:${proxy_port}`));