import cds from '@sap/cds'

const { GET, POST, expect, axios } = cds.test (import.meta.dirname+'/..')
axios.defaults.auth = { username: 'alice', password: '' }

describe('OData APIs', () => {


  it('executes me', async () => {
    const { data } = await GET `/api/me ${
      {
        user: 'alice'
      }
    }`
    console.log(data)
    // TODO finish this test
    expect(data.user).to.equal('alice')
    expect(data.claims.name).to.equal('Alice')
    expect(data.claims.email).to.equal('alice@example.com')
    expect(data.claims.phone).to.equal('1234567890')
    expect(data.claims.address).to.equal('123 Main St, Anytown, USA')
  })
})
