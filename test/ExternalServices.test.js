const cds = require('@sap/cds')

const { GET, POST, expect, axios } = cds.test (__dirname+'/..')
axios.defaults.auth = { username: 'no_user_found_for_roles_authenticated-user', password: '' }

describe('OData APIs', () => {


  it('executes chatMessages', async () => {
    const { data } = await POST `/api/chatMessages ${
      {"chatId":"chatId-24849750"}
    }`
    // TODO finish this test
    // expect(data.value).to...
  })
  it('executes chatStatus', async () => {
    const { data } = await POST `/api/chatStatus ${
      {"chatId":"chatId-17351741"}
    }`
    // TODO finish this test
    // expect(data.value).to...
  })
  it('executes userInfo', async () => {
    const { data } = await POST `/api/userInfo ${
      {}
    }`
    // TODO finish this test
    // expect(data.value).to...
  })
  it('executes callExternalService', async () => {
    const { data } = await POST `/api/callExternalService ${
      {"serviceName":"serviceName-27640946","endpoint":"endpoint-27640946"}
    }`
    // TODO finish this test
    // expect(data.value).to...
  })
})
