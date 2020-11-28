import axios, { AxiosRequestConfig, CancelTokenSource } from "axios";
import { cloneDeep } from "lodash";
import { ODataClient } from "./ODataClient";
import { ODataResponse } from "./ODataResponse";

export class ODataRequest<T> {
    public config: AxiosRequestConfig;
    private cancelTokenSource: CancelTokenSource;
    private client: ODataClient;

    constructor(client: ODataClient, config: AxiosRequestConfig, method: string, entity: string, id?: number | string) {
        this.cancelTokenSource = axios.CancelToken.source();
        this.client = client;
        this.config = {
            ...config,
            cancelToken: this.cancelTokenSource.token,
            method,
            params: {},
            url: entity,
        };
        if (id != null) {
            this.config.url += `(${id})`;
        }
    }

    public clone(): ODataRequest<T> {
        const request = new ODataRequest<T>(this.client, null, null, null);
        request.config = {
            ...cloneDeep(this.config),
            cancelToken: request.cancelTokenSource.token,
        };
        return request;
    }

    public select(...props: string[]): ODataRequest<T> {
        if (this.config.method !== "GET") {
            throw Error("Invalid request method for 'select'");
        }
        this.config.params.$select = props.join(",");
        return this;
    }

    public expand(...props: string[]): ODataRequest<T> {
        if (this.config.method !== "GET") {
            throw Error("Invalid request method for 'expand'");
        }
        this.config.params.$expand = props.join(",");
        return this;
    }

    public filter(filter: string): ODataRequest<T> {
        if (this.config.method !== "GET") {
            throw Error("Invalid request method for 'filter'");
        }
        this.config.params.$filter = filter;
        return this;
    }

    public orderby(orderby: string, direction?: string ): ODataRequest<T> {
        if (this.config.method !== "GET") {
            throw Error("Invalid request method for 'orderby'");
        }
        this.config.params.$orderby = orderby;

        if (direction) {
            this.config.params.$orderby += " " + direction;
        }
        return this;
    }

    public top(top: number | string): ODataRequest<T> {
        if (this.config.method !== "GET") {
            throw Error("Invalid request method for 'top'");
        }
        this.config.params.$top = top;
        return this;
    }

    public skip(skip: number | string): ODataRequest<T> {
        if (this.config.method !== "GET") {
            throw Error("Invalid request method for 'skip'");
        }
        this.config.params.$skip = skip;
        return this;
    }

    public count(count: boolean): ODataRequest<T> {
        if (this.config.method !== "GET") {
            throw Error("Invalid request method for 'count'");
        }
        this.config.params.$count = count ? "true" : "false";
        return this;
    }

    public search(search: string): ODataRequest<T> {
        if (this.config.method !== "GET") {
            throw Error("Invalid request method for 'search'");
        }
        this.config.params.$search = search;
        return this;
    }

    public param(key: string, value: string | number): ODataRequest<T> {
        this.config.params[key] = value;
        return this;
    }

    public ref(nevigationProperty: string, entity: string, id: number | string): ODataRequest<T> {
        if (this.config.method !== "POST" && this.config.method !== "PUT") {
            throw Error("Invalid request method for 'ref'");
        }
        this.config.url = `${this.config.url}/${nevigationProperty}/$ref`;
        let entityUrl = `${origin}${this.config.baseURL}/${entity}(${id})`;
        if (entityUrl.indexOf("http://") === -1 && entityUrl.indexOf("https://") === -1) {
            if (window != null) {
                entityUrl = window.location.origin + entityUrl;
            }
        }
        this.config.data = {
            "@odata.id": entityUrl,
        };
        return this;
    }

    public body(body: Partial<T>): ODataRequest<T> {
        if (this.config.method !== "PATCH" && this.config.method !== "POST" && this.config.method !== "PUT") {
            throw Error("Invalid request method for 'body'");
        }
        this.config.data = body;
        return this;
    }

    public async execute(): Promise<ODataResponse<T>> {
        try {
            return this.client.execute<T>(this);
        } catch (error) {
            throw error;
        }
    }

    public cancel(message?: string): void {
        this.cancelTokenSource.cancel(message);
    }
}
