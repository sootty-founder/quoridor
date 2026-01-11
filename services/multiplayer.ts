
import { SyncMessage } from '../types';

declare const Peer: any;

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export class MultiplayerService {
  private peer: any = null;
  private connection: any = null;
  private onMessageCallback: (msg: SyncMessage) => void;
  private onStatusChange: (status: ConnectionStatus) => void;
  private roomId: string;
  private isHost: boolean;

  constructor(
    roomId: string, 
    onMessage: (msg: SyncMessage) => void, 
    onStatus: (status: ConnectionStatus) => void,
    isHost: boolean
  ) {
    this.roomId = roomId;
    this.onMessageCallback = onMessage;
    this.onStatusChange = onStatus;
    this.isHost = isHost;
    
    // We use a specific prefix to avoid collisions with other PeerJS users globally
    const peerId = isHost ? `qrd-room-${roomId}` : undefined;
    
    try {
      this.onStatusChange('connecting');
      // Using default PeerJS cloud broker
      this.peer = new Peer(peerId);

      this.peer.on('open', (id: string) => {
        console.log('PeerJS: Network ID established:', id);
        if (!isHost) {
          this.connectToHost();
        } else {
          // Host is ready and waiting
          this.onStatusChange('connected'); 
        }
      });

      this.peer.on('connection', (conn: any) => {
        // Host: Receive connection from Joiner
        this.connection = conn;
        this.setupConnection();
      });

      this.peer.on('error', (err: any) => {
        console.error('PeerJS error:', err);
        this.onStatusChange('error');
        if (err.type === 'unavailable-id' && isHost) {
          alert('This Room ID is currently taken. Please create a new game.');
        }
      });
    } catch (e) {
      console.error('PeerJS Init Failed:', e);
      this.onStatusChange('error');
    }
  }

  private connectToHost() {
    const hostId = `qrd-room-${this.roomId}`;
    console.log('PeerJS: Attempting to find Host:', hostId);
    this.connection = this.peer.connect(hostId, {
      reliable: true
    });
    this.setupConnection();
  }

  private setupConnection() {
    if (!this.connection) return;

    this.connection.on('open', () => {
      console.log('PeerJS: P2P Data Channel Open');
      this.onStatusChange('connected');
    });

    this.connection.on('data', (data: any) => {
      if (this.onMessageCallback) {
        this.onMessageCallback(data as SyncMessage);
      }
    });

    this.connection.on('close', () => {
      console.log('PeerJS: Connection closed');
      this.onStatusChange('disconnected');
    });

    this.connection.on('error', () => {
      this.onStatusChange('error');
    });
  }

  sendMessage(type: SyncMessage['type'], payload: any, sender: string) {
    if (this.connection && this.connection.open) {
      this.connection.send({ type, payload, sender });
    } else {
      console.warn('PeerJS: Message failed - Connection not active');
    }
  }

  close() {
    if (this.connection) this.connection.close();
    if (this.peer) this.peer.destroy();
  }
}
