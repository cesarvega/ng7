
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material';
import { Subject } from 'rxjs';
import { startOfDay, isSameDay, isSameMonth } from 'date-fns';
import { CalendarEvent, CalendarEventAction, CalendarEventTimesChangedEvent, CalendarMonthViewDay } from 'angular-calendar';

import { FuseConfirmDialogComponent } from '@fuse/components/confirm-dialog/confirm-dialog.component';
import { fuseAnimations } from '@fuse/animations';

import { CalendarService } from './calendar.service';
import { CalendarEventModel } from './event.model';
import { CalendarEventFormDialogComponent } from './event-form/event-form.component';


import { AngularFirestore } from '@angular/fire/firestore';
// import {Moment} from 'moment/moment';
import * as moment from 'moment';

@Component({
    selector: 'calendar',
    templateUrl: './calendar.component.html',
    styleUrls: ['./calendar.component.scss'],
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations,
     providers: [AngularFirestore,  {provide: 'moment', useValue: moment }]
})
export class CalendarComponent implements OnInit {
    actions: CalendarEventAction[];
    activeDayIsOpen: boolean;
    confirmDialogRef: MatDialogRef<FuseConfirmDialogComponent>;
    dialogRef: any;
    events: CalendarEvent[];
    refresh: Subject<any> = new Subject();
    selectedDay: any;
    view: string;
    viewDate: Date;
    currentid;
    now;

    
    constructor(
        private _matDialog: MatDialog,
        private _calendarService: CalendarService,
        private db: AngularFirestore,
    ) {
        // Set the defaults
        this.view = 'month';
        this.viewDate = new Date();
        this.activeDayIsOpen = true;
        this.selectedDay = { date: startOfDay(new Date()) };

        this.actions = [
            {
                label: '<i class="material-icons s-16">edit</i>',
                onClick: ({ event }: { event: CalendarEvent }): void => {
                    this.editEvent('edit', event);
                }
            },
            {
                label: '<i class="material-icons s-16">delete</i>',
                onClick: ({ event }: { event: CalendarEvent }): void => {
                    this.deleteEvent(event);
                }
            }
        ];

        /**
         * Get events from service/server
         */
        this.setEvents();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        /**
         * Watch re-render-refresh for updating db
         */
        this.refresh.subscribe(updateDB => {
            if (updateDB) {
                this._calendarService.updateEvents(this.events);
            }
        });

        this._calendarService.onEventsUpdated.subscribe(events => {
            this.setEvents();
            this.refresh.next();
        });

        this.db.collection('events').get().subscribe((querySnapshot) => {
            querySnapshot.forEach((doc) => {
                console.log(`${doc.id} => ${doc.data()}`);
                console.dir(doc.data());
            });
        });
        this.now = moment().format();
        let myMoment = moment("10/26/1980");

    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Set events
     */
    setEvents(): void {
        this.events = this._calendarService.events.map(item => {
            item.actions = this.actions;
            return new CalendarEventModel(item);
        });
    }

    /**
     * Before View Renderer
     *
     * @param {any} header
     * @param {any} body
     */
    beforeMonthViewRender({ header, body }): void {
        /**
         * Get the selected day
         */
        const _selectedDay = body.find((_day) => {
            return _day.date.getTime() === this.selectedDay.date.getTime();
        });

        if (_selectedDay) {
            /**
             * Set selected day style
             * @type {string}
             */
            _selectedDay.cssClass = 'cal-selected';
        }

    }

    /**
     * Day clicked
     *
     * @param {MonthViewDay} day
     */
    dayClicked(day: CalendarMonthViewDay): void {
        const date: Date = day.date;
        const events: CalendarEvent[] = day.events;

        if (isSameMonth(date, this.viewDate)) {
            if ((isSameDay(this.viewDate, date) && this.activeDayIsOpen === true) || events.length === 0) {
                this.activeDayIsOpen = false;
            }
            else {
                this.activeDayIsOpen = true;
                this.viewDate = date;
            }
        }
        this.selectedDay = day;
        this.refresh.next();
    }

    /**
     * Event times changed
     * Event dropped or resized
     *
     * @param {CalendarEvent} event
     * @param {Date} newStart
     * @param {Date} newEnd
     */
    eventTimesChanged({ event, newStart, newEnd }: CalendarEventTimesChangedEvent): void {
        event.start = newStart;
        event.end = newEnd;
        const eventIndex =  this.getIndexAt(event);   
        this._calendarService.updateCalendarEvent(event, this.currentid).subscribe( updatedEvent => {            
            this.events[eventIndex] = Object.assign(this.events[eventIndex], event);
            this.refresh.next(true);
        });
    }

    /**
     * Delete Event
     *
     * @param event
     */
    deleteEvent(event): void {
        this.confirmDialogRef = this._matDialog.open(FuseConfirmDialogComponent, {
            disableClose: false
        });

        this.confirmDialogRef.componentInstance.confirmMessage = 'Are you sure you want to delete?';

        this.confirmDialogRef.afterClosed().subscribe(result => {
            if (result) {
                // let eventIndex = this.events.indexOf(event);
                const eventIndex =  this.getIndexAt(event);               
                    this._calendarService.deleteCalendarEvent(this.events[eventIndex]).subscribe(deletedeEvent => {
                        this.events.splice(eventIndex, 1);
                        this.refresh.next(true);
                    });

                }
            this.confirmDialogRef = null;
            });

    }

 

    /**
     * Edit Event
     *
     * @param {string} action
     * @param {CalendarEvent} event
     */
    editEvent(action: string, event: CalendarEvent): void {
        // const eventIndex = this.events.indexOf(event);
         
        this.dialogRef = this._matDialog.open(CalendarEventFormDialogComponent, {
            panelClass: 'event-form-dialog',
            data: {
                event: event,
                action: action
            }
        });

        this.dialogRef.afterClosed()
            .subscribe(response => {
                if (!response) {
                    return;
                }
                const actionType: string = response[0];
                const formData: FormGroup = response[1];
                switch (actionType) {
                    /**
                     * Save
                     */
                    case 'save':
                    const eventIndex =  this.getIndexAt(event);     
                    this._calendarService.updateCalendarEvent( formData.getRawValue(), this.currentid).subscribe( updatedEvent => {            
                        this.events[eventIndex] = Object.assign(this.events[eventIndex], formData.getRawValue());
                        this.refresh.next(true);
                    });
                      
                        break;
                    /**
                     * Delete
                     */
                    case 'delete':

                        this.deleteEvent(event);

                        break;
                }
            });
    }

    /**
     * Add Event
     */
    addEvent(): void {
        this.dialogRef = this._matDialog.open(CalendarEventFormDialogComponent, {
            panelClass: 'event-form-dialog',
            data: {
                action: 'new',
                date: this.selectedDay.date
            }
        });
        this.dialogRef.afterClosed()
            .subscribe((response: FormGroup) => {
                if (!response) {
                    return;
                }
                const newEvent = response.getRawValue();
                var durationInMinutes = newEvent.endTime.split(':'); 
                var minutes = (+durationInMinutes[0]) * 60 + (+durationInMinutes[1]);
                var myMomentEnd = moment(newEvent.end.toString()).add(minutes, 'minutes').format();
                durationInMinutes = newEvent.startTime.split(':'); 
                minutes = (+durationInMinutes[0]) * 60 + (+durationInMinutes[1]);
                var myMomentStart = moment(newEvent.start.toString()).add(minutes, 'minutes').format();
                console.log(myMomentEnd);
                console.log(myMomentStart);
                this._calendarService.createCalendarEvent(newEvent).subscribe(createdevent => {
                    newEvent.actions = this.actions;
                    this.events.push(newEvent);
                    this.refresh.next(true);
                });
            });
    }

    getIndexAt(event): number {
        let contador = 0;
        let eventIndex;
        this.events.map(item => {
            if (item.id === event.id) {
                eventIndex = contador;
                this.currentid = event.id;
            } else {
                contador = 1 + contador;
            }});

        return eventIndex;
    }
}


