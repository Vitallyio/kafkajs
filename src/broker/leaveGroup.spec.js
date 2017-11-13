const Broker = require('./index')
const { secureRandom, createConnection, newLogger, retryProtocol } = require('testHelpers')

describe('Broker > LeaveGroup', () => {
  let topicName, groupId, seedBroker, groupCoordinator

  beforeEach(async () => {
    topicName = `test-topic-${secureRandom()}`
    groupId = `consumer-group-id-${secureRandom()}`

    seedBroker = new Broker(createConnection(), newLogger())
    await seedBroker.connect()

    const { coordinator: { host, port } } = await retryProtocol(
      'GROUP_COORDINATOR_NOT_AVAILABLE',
      async () => await seedBroker.findGroupCoordinator({ groupId })
    )

    groupCoordinator = new Broker(createConnection({ host, port }), newLogger())
    await groupCoordinator.connect()
  })

  afterEach(async () => {
    await seedBroker.disconnect()
    await groupCoordinator.disconnect()
  })

  test('request', async () => {
    const { generationId, memberId } = await groupCoordinator.joinGroup({
      groupId,
      sessionTimeout: 30000,
    })

    const groupAssignment = [
      {
        memberId,
        memberAssignment: { [topicName]: [0] },
      },
    ]

    await groupCoordinator.syncGroup({
      groupId,
      generationId,
      memberId,
      groupAssignment,
    })

    const response = await groupCoordinator.leaveGroup({ groupId, memberId })
    expect(response).toEqual({ errorCode: 0 })
  })
})