import dav from "dav";
import * as transport from "./parsing/caldav/transport";
import { Authentication, CalendarInfo, OFCEvent } from "src/types";
import { EventResponse } from "./Calendar";
import RemoteCalendar from "./RemoteCalendar";
import { getEventsFromICS } from "src/calendars/parsing/ics";
import { ObsidianInterface } from "src/ObsidianAdapter";

export default class CalDAVCalendar extends RemoteCalendar {
    _name: string;
    credentials: Authentication;
    serverUrl: string;
    calendarUrl: string;
    _directory: string;

    events: OFCEvent[] = [];

    constructor(
        app: ObsidianInterface,
        color: string,
        name: string,
        directory: string,
        credentials: Authentication,
        serverUrl: string,
        calendarUrl: string
    ) {
        super(app, color);
        this._name = name;
        this._directory = directory;
        this.credentials = credentials;
        this.serverUrl = serverUrl;
        this.calendarUrl = calendarUrl;
    }

    async revalidate(): Promise<void> {
        let xhr = new transport.Basic(
            new dav.Credentials({
                username: this.credentials.username,
                password: this.credentials.password,
            })
        );
        let account = await dav.createAccount({
            xhr: xhr,
            server: this.serverUrl,
        });
        let calendar = account.calendars.find(
            (calendar) => calendar.url === this.calendarUrl
        );
        if (!calendar) {
            return;
        }
        let caldavEvents = await dav.listCalendarObjects(calendar, { xhr });
        this.events = caldavEvents
            .filter((vevent) => vevent.calendarData)
            .flatMap((vevent) => getEventsFromICS(vevent.calendarData));
    }

    get type(): CalendarInfo["type"] {
        return "caldav";
    }

    get identifier(): string {
        return this.calendarUrl;
    }

    get name(): string {
        return this._name;
    }

    get directory(): string {
        return this._directory;
    }

    async getEvents(): Promise<EventResponse[]> {
        return this.events.map((e) => [e, null]);
    }
}
