const cds = require('@sap/cds');

module.exports = cds.service.impl(async function() {
  
  // Consume chat messages through CDS service consumption
  this.on('chatMessages', async (req) => {
    const { chatId } = req.data;
    
    try {
      // Use CDS to consume the external chat service
      const chatService = await cds.connect.to('chat-api', {
        url: 'https://router-chat-approuter-demo.c-127c9ef.stage.kyma.ondemand.com',
        auth: 'ias' // Use IAS authentication
      });
      
      // Make the request through CDS
      const response = await chatService.get(`/chats/${chatId}/messages`, {
        headers: {
          'Accept': 'text/event-stream'
        }
      });
      
      // Set up EventSource response
      req.res.setHeader('Content-Type', 'text/event-stream');
      req.res.setHeader('Cache-Control', 'no-cache');
      req.res.setHeader('Connection', 'keep-alive');
      req.res.setHeader('Access-Control-Allow-Origin', '*');
      
      // Stream the response
      response.pipe(req.res);
      
    } catch (error) {
      req.error(500, `Failed to consume chat service: ${error.message}`);
    }
  });
  
  // Consume chat status through CDS service consumption
  this.on('chatStatus', async (req) => {
    const { chatId } = req.data;
    
    try {
      // Use CDS to consume the external chat service
      const chatService = await cds.connect.to('chat-api', {
        url: 'https://router-chat-approuter-demo.c-127c9ef.stage.kyma.ondemand.com',
        auth: 'ias' // Use IAS authentication
      });
      
      // Make the request through CDS
      const response = await chatService.get(`/chats/${chatId}/status`, {
        headers: {
          'Accept': 'text/event-stream'
        }
      });
      
      // Set up EventSource response
      req.res.setHeader('Content-Type', 'text/event-stream');
      req.res.setHeader('Cache-Control', 'no-cache');
      req.res.setHeader('Connection', 'keep-alive');
      req.res.setHeader('Access-Control-Allow-Origin', '*');
      
      // Stream the response
      response.pipe(req.res);
      
    } catch (error) {
      req.error(500, `Failed to consume chat service: ${error.message}`);
    }
  });
  
  // Consume user info through CDS service consumption
  this.on('userInfo', async (req) => {
    try {
      // Use CDS to consume the user service
      const userService = await cds.connect.to('user-api', {
        url: 'https://router-approuter-approuter-demo.c-127c9ef.stage.kyma.ondemand.com',
        auth: 'ias' // Use IAS authentication
      });
      
      // Make the request through CDS
      const response = await userService.get('/auth/api/me');
      
      return {
        id: response.id || 'unknown',
        name: response.name || 'Unknown User',
        email: response.email || 'unknown@example.com'
      };
      
    } catch (error) {
      req.error(500, `Failed to consume user service: ${error.message}`);
    }
  });
  
  // Generic service consumption
  this.on('callExternalService', async (req) => {
    const { serviceName, endpoint } = req.data;
    
    try {
      // Use CDS to consume the specified service
      const service = await cds.connect.to(serviceName, {
        auth: 'ias' // Use IAS authentication
      });
      
      // Make the request through CDS
      const response = await service.get(endpoint);
      
      return JSON.stringify(response);
      
    } catch (error) {
      req.error(500, `Failed to consume ${serviceName}: ${error.message}`);
    }
  });
});
