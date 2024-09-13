//1. so you have ur custom messages in yaml.

//2. You need to define your guild schema:
import { Schema, model, Document } from 'mongoose';

interface IGuild extends Document {
    guildId: string;
    isModule: boolean;
    messages: Map<string, string>;
}

const guildSchema = new Schema<IGuild>({
    guildId: { type: String, required: true, unique: true },
    isModule: { type: Boolean, default: false },
    messages: { type: Map, of: String }
});

export const Guild = model<IGuild>('Guild', guildSchema);
//=====================================================================================//

//3. Now you load the default messages

import fs from 'fs';
import path from 'path';

const defaultMessagesPath = path.resolve(__dirname, 'defaultMessages.yaml');
const defaultMessages = JSON.parse(fs.readFileSync(defaultMessagesPath, 'utf-8'));
//=====================================================================================//

//4. Now u fetch the messages for a guild
import { Guild } from 'path to ur schema in Nr.2';

async function getMessagesForGuild(guildId: string): Promise<Map<string, string>> {
    const guild = await Guild.findOne({ guildId });

    if (!guild) {
        return new Map(Object.entries(defaultMessages));
    }

    const messages = new Map(Object.entries(defaultMessages));

    guild.messages.forEach((value, key) => {
        messages.set(key, value);
    });

    return messages;
}
//=====================================================================================//

//5. use the mesages in ur bot (idk ur bot commandhandler so imma just go with this:)

async function handleCommand(command: string, guildId: string) {
    const messages = await getMessagesForGuild(guildId);

    switch (command) {
        case 'command1':
            console.log(messages.get('msg1')); // use msg for command 1
            break;
        case 'command2':
            console.log(messages.get('msg2'));
            break;
        //.......
        default:
            console.log('Unknown command');
    }
}
//=====================================================================================//

//You will need to modify the code to ur DB and bot since thius is just basics of basics aa...
