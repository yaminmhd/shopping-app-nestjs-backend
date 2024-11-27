import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthService } from '../auth/auth.service';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ProductsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(ProductsGateway.name);
  private connectedClients: Set<Socket> = new Set();

  constructor(private readonly authService: AuthService) {}

  @WebSocketServer()
  server: Server;

  handleProductUpdated() {
    this.server.emit('product_updated');
  }

  afterInit() {
    this.logger.log('Initialized');
  }

  handleDisconnect(client: any) {
    this.connectedClients.delete(client);
    this.logger.log(`Client id:${client.id} disconnected`);
    this.logger.debug(
      `Number of connected clients: ${this.connectedClients.size}`,
    );
  }

  handleConnection(client: Socket) {
    this.connectedClients.add(client);
    this.logger.log(`Client id: ${client.id} connected`);
    this.logger.debug(
      `Number of connected clients: ${this.connectedClients.size}`,
    );
    try {
      this.authService.verifyToken(client.handshake.auth.Authentication.value);
    } catch (err) {
      throw new WsException('Unauthorized.');
    }
  }
}
