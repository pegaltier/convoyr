import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { HttpExtModule } from './http-ext.module';
import { createSpyPlugin } from './http-ext.spec';

describe('HttpExtModule', () => {
  let spyPlugin;

  beforeEach(() => {
    spyPlugin = createSpyPlugin();

    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        HttpExtModule.forRoot({
          plugins: [spyPlugin]
        })
      ]
    });
  });

  let httpClient: HttpClient;
  beforeEach(() => (httpClient = TestBed.get(HttpClient)));

  let httpController: HttpTestingController;
  beforeEach(() => (httpController = TestBed.get(HttpTestingController)));

  afterEach(() => httpController.verify());

  it('should handle http request', () => {
    const observer = jest.fn();

    httpClient
      .get('https://jscutlery.github.io/items/ITEM_ID')
      .subscribe(observer);

    httpController
      .expectOne('https://jscutlery.github.io/items/ITEM_ID')
      .flush({
        id: 'ITEM_ID',
        title: 'ITEM_TITLE'
      });

    expect(observer).toHaveBeenCalledTimes(1);
    expect(observer.mock.calls[0][0]).toEqual({
      id: 'ITEM_ID',
      title: 'ITEM_TITLE'
    });

    expect(spyPlugin.handle).toHaveBeenCalledTimes(1);
    expect(spyPlugin.handle.mock.calls[0][0].request).toEqual({
      url: 'https://jscutlery.github.io/items/ITEM_ID',
      method: 'GET',
      body: null,
      headers: {},
      params: {}
    });
    expect(typeof spyPlugin.handle.mock.calls[0][0].next).toEqual('function');
  });
});