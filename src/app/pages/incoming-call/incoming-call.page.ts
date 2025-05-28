import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Jitsi } from 'src/plugins/jitsi';


@Component({
  standalone:false,
  selector: 'app-incoming-call',
  templateUrl: './incoming-call.page.html',
  styleUrls: ['./incoming-call.page.scss'],
})
export class IncomingCallPage implements OnInit {
  
  callerName: string = '';  
  roomName: string = '';    

  constructor(private router: Router, private route: ActivatedRoute) {}

  ngOnInit() {
    const callerNameFromParam = this.route.snapshot.queryParamMap.get('callerName');
    const roomNameFromParam = this.route.snapshot.queryParamMap.get('roomName');
    
    if (callerNameFromParam !== null) {
      this.callerName = callerNameFromParam;
    }
    if (roomNameFromParam !== null) {
      this.roomName = roomNameFromParam;
    }
  }

  aceptarLlamada() {
    if (this.roomName) {
      Jitsi.startConference({
        roomName: this.roomName,  
      }).then(() => {
        console.log('Llamada aceptada, iniciando conferencia');
      }).catch((error: any) => { 
        console.error('Error al iniciar la llamada', error);
      });
    } else {
      console.error('No se proporcionó un nombre de sala válido');
    }
  }

  rechazarLlamada() {
    this.router.navigate(['/home']); 
  }
}
