const AccessLevel = require('./accessLevel');
const ApiKey = require('./apiKey');
const ApiLink = require('./apiLink');
const ApiLink2 = require('./apiLink2');
const ApiStatus = require('./apiStatus');
const BanSchema = require('./BanSchema');
const Click = require('./click');
const Link = require('./link');
const LinkCount = require('./LinkCount');
const LinkedUrl = require('./LinkedUrl');
const LinkInfo = require('./LinkInfo');
const linkShortenerStatus = require('./linkShortenerStatus');
const UserBanSchema = require('./UserBanSchema');
const User = require('./user');
const UnderConstruction = require('./underConstruction');
const NewCollection = require('./newCollection');
const MaintenanceStatus = require('./maintenanceStatus');

module.exports = {
    AccessLevel,
    ApiKey,
    ApiLink,
    ApiLink2,
    apiStatus: ApiStatus,
    Ban: BanSchema,
    Click,
    Link,
    LinkCount,
    LinkedUrl,
    LinkInfo,
    LinkShortenerStatus: linkShortenerStatus,
    UserBanSchema,
    User,
    underConstructionStatus: UnderConstruction,
    NewCollection,
    MaintenanceStatus,
};
