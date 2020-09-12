import {
  BrowserWindow,
  session,
  BrowserWindowConstructorOptions,
} from "electron";
import { OpenIdError, RelyingParty } from "openid";
import { parse } from "url";
import fetch from "node-fetch";

/**
 * Authentication Options: Defines the Authentication Electron BrowserWindow.
 */
interface AuthenticationOptions {
  window?: BrowserWindowConstructorOptions;
}

/**
 * Contains the data returned from the OpenID RelyingParty.
 */
interface ElectronSteamProfileToken {
  ns: string;
  mode: string;
  op_endpoint: string;
  claimed_id: string;
  return_to: string;
  response_nonce: string;
  assoc_handle: string;
  identity: string;
  steam_id: string;
  signature: string;
  signed: string;
}

/**
 * Callback for the Authenticate method.
 */
type ElectronSteamNextFunction = (
  player: SteamUser,
  token?: ElectronSteamProfileToken
) => void;

/**
 * Represents the user's steam status.
 */
enum SteamPlayerState {
  "Offline",
  "Online",
  "Busy",
  "Away",
  "Snooze",
  "Looking to Trade",
  "Looking to Play",
}

/**
 * The unused objects remain as defined in the steam API spec.
 */
enum SteamPlayerVisibility {
  "Private",
  "<Unused>",
  "_Unused_",
  "Public",
}

/**
 * More information on the SteamUser can be found in the official steam docs.
 * https://developer.valvesoftware.com/wiki/Steam_Web_API
 */
interface SteamUser {
  steamid: string;
  personaname: string;
  profileurl: string;
  avatar: string;
  avatarmedium: string;
  avatarfull: string;
  personastate: SteamPlayerState;
  communityvisibilitystate: SteamPlayerVisibility;
  profilestate: boolean;
  lastlogoff: Date;
  commentpermission: boolean;
  realname?: string;
  primaryclanid?: string;
  timecreated?: string;
  gameid?: string;
  gameserverip?: string;
  gameextrainfo?: string;
  cityid?: string;
  loccountrycode?: string;
  locstatecode?: string;
  loccityid?: string;
}

class ElectronSteam {
  token: ElectronSteamProfileToken | null = null;
  user: SteamUser | null = null;

  constructor(private steamAPIToken: string) {}

  /**
   * Makes an API call to the Steam API, returns the profile data of the user.
   * @param steam_id
   */
  async getProfileData(steam_id: string): Promise<SteamUser> {
    if (!this.token) {
      throw new Error("Invalid Steam API Token.");
    }
    const steamUrl = `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${this.steamAPIToken}&steamids=${steam_id}`;
    const res = await fetch(steamUrl);
    const data = await res.json();
    return <SteamUser>data.response.players[0];
  }

  /**
   * Callback function called when the OpenID endpoint attempts to redirect you.
   * @param redirectUrl - the redirection URL.
   * @param next - function to execute on successful login.
   */
  async handleRedirect(
    redirectUrl: string,
    next?: ElectronSteamNextFunction
  ): Promise<void> {
    const query = parse(redirectUrl, true).query;
    if (
      !query["openid.response_nonce"] ||
      !query["openid.assoc_handle"] ||
      !query["openid.identity"] ||
      !query["openid.sig"] ||
      !query["openid.ns"] ||
      !query["openid.op_endpoint"] ||
      !query["openid.claimed_id"] ||
      !query["openid.return_to"] ||
      !query["openid.signed"]
    ) {
      throw new Error("Received malformed Profile token from Steam.");
    }
    this.token = {
      ns: query["openid.ns"] as string,
      mode: query["openid.mode"] as string,
      op_endpoint: query["openid.op_endpoint"] as string,
      claimed_id: query["openid.claimed_id"] as string,
      return_to: query["openid.return_to"] as string,
      signed: query["openid.signed"] as string,
      response_nonce: query["openid.response_nonce"] as string,
      assoc_handle: query["openid.assoc_handle"] as string,
      identity: query["openid.identity"] as string,
      signature: query["openid.sig"] as string,
      steam_id: "",
    };
    if (this.token) {
      this.token["steam_id"] = (this.token.identity as any).match(
        /\/id\/(.*$)/
      )[1];
    }

    this.user = await this.getProfileData(this.token["steam_id"]);

    if (next) {
      next(this.user, this.token);
    }
  }

  /**
   * Attempts to authenticate a user using OpenID.
   * Due to issues with electron's BrowserWindow system, token may not persist.
   * We can also use the callback to retrieve it.
   * @param next
   * @param options
   */
  async authenticate(
    next?: ElectronSteamNextFunction,
    options?: AuthenticationOptions
  ): Promise<void> {
    const rely: RelyingParty = new RelyingParty(
      "http://localhost",
      null,
      true,
      false,
      []
    );

    const callback = async (
      error: OpenIdError | null,
      authUrl: string | null
    ): Promise<void> => {
      if (error) {
        throw error;
      }
      if (!authUrl) {
        throw new Error("Unable to reach steam authentication URL.");
      }

      let authWindowOptions: BrowserWindowConstructorOptions = {
        alwaysOnTop: true,
        autoHideMenuBar: true,
        webPreferences: {
          nodeIntegration: false,
        },
        height: 600,
        width: 800,
      };
      if (options && options.window) {
        authWindowOptions = options.window;
      }

      const authWindow = new BrowserWindow(authWindowOptions);

      session.defaultSession.webRequest.onBeforeRedirect(async (details) => {
        await this.handleRedirect(details.redirectURL, next);
        await authWindow.close();
      });

      try {
        await authWindow.loadURL(authUrl);
        await authWindow.show();
      } catch (e) {
        throw e;
      }
    };

    await rely.authenticate(
      "http://steamcommunity.com/openid",
      false,
      callback
    );
  }
}

export {
  ElectronSteam,
  AuthenticationOptions,
  ElectronSteamProfileToken,
  SteamUser,
  SteamPlayerVisibility,
  SteamPlayerState,
  ElectronSteamNextFunction
};
