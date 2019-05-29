https://github.com/angular/angular/issues/11853

Implementing e2e tests for an Angular app which polls a WebSocket connection is an impossible task - 
using Protractor.
The issue is that tests timeout as Protractor waits for Angular to become stable. 
The workaround is to disable browser synchronisation, but this is a hack and it leads to flaky tests.