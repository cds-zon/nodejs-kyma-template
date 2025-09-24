const cds = require('@sap/cds')

const { GET, POST, expect, axios } = cds.test (__dirname+'/..')
axios.defaults.auth = { username: 'no_user_found_for_roles_authenticated-user', password: '' }

describe('OData APIs', () => {


  it('executes messages', async () => {
    const { data } = await POST `/api/messages ${
      {"chatId":"chatId-27804529"}
    }`
    // TODO finish this test
    // expect(data.value).to...
  })
  it('executes status', async () => {
    const { data } = await POST `/api/status ${
      {"chatId":"chatId-22163945"}
    }`
    // TODO finish this test
    // expect(data.value).to...
  })
  it('executes info', async () => {
    const { data } = await POST `/api/info ${
      {"chatId":"chatId-13361801"}
    }`
    // TODO finish this test
    // expect(data.value).to...
  })
  it('executes create', async () => {
    const { data } = await POST `/api/create ${
      {}
    }`
    // TODO finish this test
    // expect(data.value).to...
  })
})
