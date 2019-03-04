const { expect } = require('chai');
const faye = require('faye');
const hat = require('hat');
const redis = require('redis');

const fayeRedis = require('../faye-redis');
const utils = require('./utils');

describe('Redis engine', function() {
    const namespace = 'faye';
    let channel;
    let clientId;
    let engineOpts;
    let redisClient;
    let engine;
    let bayeux;

    before(() => {
        redisClient = redis.createClient();
    });

    after(async () => {
        await utils.invokeAsPromise(redisClient, 'quit');
    });

    beforeEach(() => {
        bayeux = new faye.NodeAdapter({ mount: '/faye', timeout: 45 });
        engine = fayeRedis.create(bayeux._server._engine, { namespace });

        clientId = hat();
        channel = hat();
    });

    afterEach(() => {
        engine.disconnect();
        bayeux.close();
    });

    describe('#subscribe', function() {
        it('should subscribe the client to the channel', async () => {
            await new Promise((resolve) => engine.subscribe(clientId, channel, resolve));

            const channelIsMember = await utils.invokeAsPromise(
                redisClient,
                'sismember',
                `${namespace}/clients/${clientId}/channels`,
                channel,
            );
            expect(channelIsMember).to.be.eql(1);

            const clientIsMember = await utils.invokeAsPromise(
                redisClient,
                'sismember',
                `${namespace}/channels${channel}`,
                clientId,
            );
            expect(clientIsMember).to.be.eql(1);
        });

        it('should add a new entry to `faye/clients` sorted set', async () => {
            const clientId = hat();

            await new Promise((resolve) => engine.subscribe(clientId, channel, resolve));

            const clientScore = await utils.invokeAsPromise(redisClient, 'zscore', `${namespace}/clients`, clientId);
            expect(clientScore).to.not.be.undefined;
        });
    });
});
