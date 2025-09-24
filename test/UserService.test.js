const cds = require('@sap/cds')

const { GET, POST, expect, axios } = cds.test (__dirname+'/..')
axios.defaults.auth = { username: 'no_user_found_for_roles_authenticated-user', password: '' }

describe('OData APIs', () => {


  it('executes me', async () => {
    const { data } = await POST `/api/me ${
      {}
    }`
    // TODO finish this test
    // expect(data.value).to...
  })
})
