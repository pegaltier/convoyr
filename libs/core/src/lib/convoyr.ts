import { Observable, of } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

import { ConvoyrPlugin } from './plugin';
import { ConvoyrRequest } from './request';
import { NextHandler } from './request-handler';
import { ConvoyrResponse } from './response';
import { throwIfInvalidPluginCondition } from './throw-invalid-plugin-condition';
import { fromSyncOrAsync } from './utils/from-sync-or-async';
import { isFunction } from './utils/is-function';

export function invalidHandleRequestConditionError() {
  return new Error('"shouldHandleRequest" should be a function.');
}

export interface ConvoyrConfig {
  plugins: ConvoyrPlugin[];
}

export class Convoyr {
  private _plugins: ConvoyrPlugin[];

  constructor({ plugins }: ConvoyrConfig) {
    this._plugins = plugins;
  }

  handle({
    request,
    httpHandler,
  }: {
    request: ConvoyrRequest;
    httpHandler: NextHandler;
  }): Observable<ConvoyrResponse> {
    return this._handle({
      request,
      plugins: this._plugins,
      httpHandler,
    });
  }

  private _handle({
    request,
    plugins,
    httpHandler,
  }: {
    request: ConvoyrRequest;
    plugins: ConvoyrPlugin[];
    httpHandler: NextHandler;
  }): Observable<ConvoyrResponse> {
    if (plugins.length === 0) {
      return httpHandler.handle({ request });
    }

    const [plugin] = plugins;
    const { handler } = plugin;

    /**
     * Calls next plugins recursively.
     */
    const next: NextHandler = {
      handle: (args) => {
        const response = this._handle({
          request: args.request,
          plugins: plugins.slice(1),
          httpHandler,
        });
        return fromSyncOrAsync(response);
      },
    };

    /**
     * Handle plugin if plugin's condition tells so.
     */
    return this._shouldHandle({ request, plugin }).pipe(
      mergeMap(throwIfInvalidPluginCondition),
      mergeMap((shouldHandle) => {
        if (shouldHandle === false) {
          return next.handle({ request });
        }

        return fromSyncOrAsync(handler.handle({ request, next }));
      })
    );
  }

  /**
   * Tells if the given plugin should be handled or not depending on plugins condition.
   */
  private _shouldHandle({
    request,
    plugin,
  }: {
    request: ConvoyrRequest;
    plugin: ConvoyrPlugin;
  }): Observable<boolean> {
    if (
      plugin.shouldHandleRequest != null &&
      !isFunction(plugin.shouldHandleRequest)
    ) {
      throw invalidHandleRequestConditionError();
    }

    if (plugin.shouldHandleRequest == null) {
      return of(true);
    }

    return fromSyncOrAsync(plugin.shouldHandleRequest({ request }));
  }
}
