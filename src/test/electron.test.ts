import {ElectronSteam} from "../index";

describe("electron-steam", () => {

    it('loads', () => {
        const ElectronSteam = require('../index');
        expect(ElectronSteam).not.toBeNull();
    });

    it('creates a new electron-steam instance', async () => {
        const steam = new ElectronSteam("token");
        expect(steam).not.toBeNull();
    });

    it("doesn't create unauthorized user", async () => {
        const steam = new ElectronSteam("token");
        steam.authenticate((steamUser) => {
           expect(steamUser).toBeNull();
           expect(steam.user).toBeNull();
        });
    });

    it("doesn't load a token", async () => {
        const steam = new ElectronSteam("token");
        await steam.authenticate((steamUser, steamToken) => {
            expect(steamToken).toBeNull();
            expect(steam.token).toBeNull();
        });
    });
});