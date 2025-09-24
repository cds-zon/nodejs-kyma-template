@path: '/chat-test'
@requires: ['authenticated-user']
@impl: 'srv/external-services.js'
service ExternalServices {
  
  // Consume the chat service through CDS
  @rest function chatMessages(chatId: String) returns String;
  
  @rest function chatStatus(chatId: String) returns String;
  
  // Consume the user service
  @rest function userInfo() returns {
    id: String;
    name: String;
    email: String;
  };
  
  // Generic service consumption
  @rest function callExternalService(serviceName: String, endpoint: String) returns String;
}
