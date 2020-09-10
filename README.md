# electron-steam
This library provides basic steam authentication for your electron app using OpenAPI.

## install
`$ npm install electron-steam`

## usage
```js
const steam = new ElectronSteam("your_token_here");
try{
    steam.authenticate((user, token) => {
        // use the user or the token.
    });
} catch (e){
    console.log(e);
}
```

## API

Note that the Token passed into the constructor and the `ElectronSteam.token` objects are not the same! The second is the authentication token returned by the OpenID request.
```typescript
ElectronSteam(APIToken:string){
    user: SteamUser | null;
    token: ElectronSteamProfileToken | null;
    authenticate: (
        next?: ElectronSteamNextFunction, 
        options?: AuthenticationOptions
    ): Promise<void> => {};
};
```