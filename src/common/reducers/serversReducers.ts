import { Reducer } from 'redux';

import { Server } from '../../servers/common';
import { ActionOf } from '../../store/rootAction';
import * as appActions from '../actions/appActions';
import { DEEP_LINKS_SERVER_ADDED } from '../actions/deepLinksActions';
import { SERVERS_LOADED } from '../actions/serversActions';
import {
  ADD_SERVER_VIEW_SERVER_ADDED,
  SIDE_BAR_REMOVE_SERVER_CLICKED,
  SIDE_BAR_SERVERS_SORTED,
  WEBVIEW_DID_NAVIGATE,
  WEBVIEW_SIDEBAR_STYLE_CHANGED,
  WEBVIEW_TITLE_CHANGED,
  WEBVIEW_UNREAD_CHANGED,
  WEBVIEW_FAVICON_CHANGED,
  WEBVIEW_DID_START_LOADING,
  WEBVIEW_DID_FAIL_LOAD,
  WEBVIEW_ATTACHED,
} from '../actions/uiActions';

const ensureUrlFormat = (serverUrl: string | null): string => {
  if (serverUrl) {
    return new URL(serverUrl).href;
  }

  throw new Error('cannot handle null server URLs');
};

type ServersActionTypes =
  | ActionOf<typeof ADD_SERVER_VIEW_SERVER_ADDED>
  | ActionOf<typeof DEEP_LINKS_SERVER_ADDED>
  | ActionOf<typeof SERVERS_LOADED>
  | ActionOf<typeof SIDE_BAR_REMOVE_SERVER_CLICKED>
  | ActionOf<typeof SIDE_BAR_SERVERS_SORTED>
  | ActionOf<typeof WEBVIEW_DID_NAVIGATE>
  | ActionOf<typeof WEBVIEW_SIDEBAR_STYLE_CHANGED>
  | ActionOf<typeof WEBVIEW_TITLE_CHANGED>
  | ActionOf<typeof WEBVIEW_UNREAD_CHANGED>
  | ActionOf<typeof WEBVIEW_FAVICON_CHANGED>
  | ActionOf<typeof appActions.settingsLoaded.type>
  | ActionOf<typeof WEBVIEW_DID_START_LOADING>
  | ActionOf<typeof WEBVIEW_DID_FAIL_LOAD>
  | ActionOf<typeof WEBVIEW_ATTACHED>
  | ActionOf<'webview/userPresenceParametersChanged'>
  | ActionOf<'server/idleStateChanged'>;

const sameServer = (a: Server, b: Server) => {
  if (a === b) {
    return true;
  }

  let equals = true;
  for (const key in a) {
    if (a[key] !== b[key]) {
      equals = false;
      break;
    }
  }

  return equals;
};

const upsert = (state: Server[], server: Server): Server[] => {
  const index = state.findIndex(({ url }) => url === server.url);

  if (index === -1) {
    return [...state, server];
  }

  const currentServer = state[index];
  const newServer = { ...currentServer, ...server };

  if (sameServer(currentServer, newServer)) {
    return state;
  }

  return [...state.slice(0, index), newServer, ...state.slice(index + 1)];
};

const update = (state: Server[], server: Server): Server[] => {
  const index = state.findIndex(({ url }) => url === server.url);

  if (index === -1) {
    return state;
  }

  const currentServer = state[index];
  const newServer = { ...currentServer, ...server };

  if (sameServer(currentServer, newServer)) {
    return state;
  }

  return [...state.slice(0, index), newServer, ...state.slice(index + 1)];
};

export const servers: Reducer<Server[], ServersActionTypes> = (
  state = [],
  action
) => {
  switch (action.type) {
    case ADD_SERVER_VIEW_SERVER_ADDED:
    case DEEP_LINKS_SERVER_ADDED: {
      const url = action.payload;
      return upsert(state, { url, title: url });
    }

    case SIDE_BAR_REMOVE_SERVER_CLICKED: {
      const _url = action.payload;
      return state.filter(({ url }) => url !== _url);
    }

    case SIDE_BAR_SERVERS_SORTED: {
      const urls = action.payload;
      return state.sort(
        ({ url: a }, { url: b }) => urls.indexOf(a) - urls.indexOf(b)
      );
    }

    case WEBVIEW_TITLE_CHANGED: {
      const { url, title = url } = action.payload;
      return upsert(state, { url, title });
    }

    case WEBVIEW_UNREAD_CHANGED: {
      const { url, badge } = action.payload;
      return upsert(state, { url, badge });
    }

    case WEBVIEW_SIDEBAR_STYLE_CHANGED: {
      const { url, style } = action.payload;
      return upsert(state, { url, style });
    }

    case WEBVIEW_FAVICON_CHANGED: {
      const { url, favicon } = action.payload;
      return upsert(state, { url, favicon });
    }

    case 'webview/userPresenceParametersChanged': {
      const { url, isAutoAwayEnabled, idleThreshold } = action.payload;
      return upsert(state, { url, isAutoAwayEnabled, idleThreshold });
    }

    case WEBVIEW_DID_NAVIGATE: {
      const { url, pageUrl } = action.payload;
      if (pageUrl?.includes(url)) {
        return upsert(state, { url, lastPath: pageUrl });
      }

      return state;
    }

    case WEBVIEW_DID_START_LOADING: {
      const { url } = action.payload;
      return upsert(state, { url, failed: false });
    }

    case WEBVIEW_DID_FAIL_LOAD: {
      const { url, isMainFrame } = action.payload;
      if (isMainFrame) {
        return upsert(state, { url, failed: true });
      }

      return state;
    }

    case SERVERS_LOADED: {
      const { servers = state } = action.payload;
      return servers.map((server) => ({
        ...server,
        url: ensureUrlFormat(server.url),
      }));
    }

    case appActions.settingsLoaded.type: {
      const { servers = state } = action.payload;
      return servers.map((server) => ({
        ...server,
        url: ensureUrlFormat(server.url),
      }));
    }

    case WEBVIEW_ATTACHED: {
      const { url, webContentsId } = action.payload;
      return update(state, { url, webContentsId });
    }

    case 'server/idleStateChanged': {
      const { url, idleState } = action.payload;
      return upsert(state, { url, idleState });
    }

    default:
      return state;
  }
};