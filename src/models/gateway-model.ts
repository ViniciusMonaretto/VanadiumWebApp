export class GatewayModule{
    public gatewayId: string;
    public name: string;
    public image: string;
    public ip: string;
    public uptime: Date;
    public status: 'online' | 'offline' | 'warning' | string;
    public lastActivity: string;
    public availableSensors: string[];

    constructor() {
        this.gatewayId = '';
        this.name = '';
        this.image = '';
        this.ip = '';
        this.uptime = new Date();
        this.status = 'offline';
        this.lastActivity = '';
        this.availableSensors = [];
    }
}