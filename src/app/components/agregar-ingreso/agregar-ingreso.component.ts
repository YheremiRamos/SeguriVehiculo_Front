import { Component, OnInit } from '@angular/core';
import { AppMaterialModule } from '../../app.material.module';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MenuComponent } from '../../menu/menu.component';
import Swal from 'sweetalert2';
import { TokenService } from '../../security/token.service';
import { Usuario } from '../../models/usuario.model';
import { MatStepperModule } from '@angular/material/stepper';
import { UsuarioService } from '../../services/usuario.service';
import { TipoUsuario } from '../../models/tipoUsuario.model';
import { EspacioParqueo } from '../../models/espacioParqueo';
import { EspacioParqueoService } from '../../services/espacioParqueo.service';
import { ingresoVehicularService } from '../../services/ingresoVehicular.service';
import { Cliente } from '../../models/cliente.model';
import { Parqueo } from '../../models/parqueo.model';
import { AccesoVehicular } from '../../models/accesoVehicular.model';
import { UtilService } from '../../services/util.service';
import { forkJoin } from 'rxjs';
import { animate, state, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-agregar-ingreso',
  standalone: true,
  imports: [AppMaterialModule,
    FormsModule, CommonModule, MenuComponent, ReactiveFormsModule, MatStepperModule],
  templateUrl: './agregar-ingreso.component.html',
  styleUrls: ['./agregar-ingreso.component.css'],
  animations: [
    trigger('fadeSlide', [
      state('hidden', style({ opacity: 0, transform: 'translateY(-10px)' })),
      state('visible', style({ opacity: 1, transform: 'translateY(0)' })),
      transition('hidden => visible', [animate('300ms ease-out')]),
      transition('visible => hidden', [animate('300ms ease-in')])
    ])
  ]
})

export class AgregarIngresoComponent implements OnInit {
  espacioForm = this.formBuilder.group({
    espacio: ['', Validators.required],


  });

  objAccesoVehicular: AccesoVehicular = {
    cliente: {
      identificador: "",
      nombres: "",
      apellidos: "",
      telefono: "",
      idCliente: 0 // Añadir idCliente para evitar el error en el acceso
    },
    placaVehiculo: "",
    parqueo: {
      idParqueo: 0 // Añadir idParqueo para evitar el error en el acceso
    },
    espacio: {
      numeroEspacio: 0,
      idEspacio: 0 // Añadir idEspacio para evitar el error en el acceso
    }
  };

  objCliente: Cliente = {
    idCliente: 0,
    nombres: "",
    apellidos: "",
    identificador: "",
    telefono: "",
    numIncidencias: 0

  }

  formRegistraUsuario = this.formBuilder.group({
    idCliente: [0], // Campo oculto que contiene el ID del cliente
    idUsuario: [0], // Campo oculto para el usuario autenticado
    idParqueo: [0], // Campo oculto para el parqueo
    idEspacio: [0], // Campo oculto para el espacio de parqueo
    tipoUsuario: ['', Validators.min(1)],
    dni: ['', [Validators.required, Validators.minLength(3), Validators.pattern('^[0-9]{8,12}$')]],
    nombres: [{ value: '', disabled: true }, [Validators.required, Validators.minLength(3), Validators.pattern('^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ ]+$')]],
    apellidos: [{ value: '', disabled: true }, [Validators.required, Validators.minLength(3), Validators.pattern('^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ ]+$')]],
    telefono: ['', [Validators.required, Validators.minLength(7), Validators.pattern('^[0-9]{7,9}$')]],
  });
 

  formRegistraVehiculo = this.formBuilder.group({
    tipoVehiculo: [{ value: '', disabled: true }, Validators.min(1)],
    placa: ['', [Validators.required, Validators.pattern('^[A-Z]{2}-\\d{3,5}$')]],
    cantPersonas: ['', [Validators.required, Validators.pattern('^[1-9]$')]],
    espacio: [0, []],
  });
 

  // Variables para almacenar los espacios obtenidos de la API
  objetosEspaciosPP: EspacioParqueo[] = [];
  objetosEspaciosPS: EspacioParqueo[] = [];
  objetosEspaciosPSS: EspacioParqueo[] = [];

  espaciosDiscapacitadoPP: string[] = [];
  espacioGerentePP: string[] = [];
  espaciosGeneralPP: string[] = [];

  espaciosDiscapacitadoPS: string[] = [];
  espacioGerentePS: string[] = [];
  espaciosGeneralPS: string[] = [];

  espaciosDiscapacitadoPSS: string[] = [];
  espacioGerentePSS: string[] = [];
  espaciosGeneralPSS: string[] = [];

  espacioSeleccionado: number = 0;
  mostrarNivelPrincipal: boolean = false;
  mostrarNivelSemiSotano: boolean = false;
  mostrarNivelSotano: boolean = false;

  dataSource: any;
  filtro: string = '';
  varDni: string = '';


  objUsuario: Usuario = {};
  objParqueo: Parqueo = {};
  objEspacio: EspacioParqueo = {};

  dni = '';
  varNombres = '';
  varApellidos = '';
  varTelefono: number = 0;
  varIdTipoUsuario: number = -1;
  lstTipoUsuario: TipoUsuario[] = [];

  horaIngreso: Date = new Date();
  formattedDate = this.horaIngreso.toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
    // Variable para indicar si hubo error en la búsqueda
    errorEnBusqueda: boolean = false;
  constructor(
    private tokenService: TokenService,
    private usuarioService: UsuarioService,
    private ingresoVehicularService: ingresoVehicularService,
    private formBuilder: FormBuilder,
    private espaciService: EspacioParqueoService,
    private utilService: UtilService,
  ) {
    this.objUsuario.idUsuario = this.tokenService.getUserId();
  }

  ngOnInit(): void {
    // this.loadWatsonAssistant();
    this.cargarEspacios();


      this.formRegistraUsuario.patchValue({
        idUsuario: this.tokenService.getUserId()
      });


      this.formRegistraUsuario.get('tipoUsuario')?.valueChanges.subscribe((valor) => {
        if (valor && valor !== '-1') {
          this.formRegistraVehiculo.get('tipoVehiculo')?.enable(); // Habilitar si se selecciona un tipo de usuario
        } else {
          this.formRegistraVehiculo.get('tipoVehiculo')?.disable(); // Deshabilitar si no hay selección válida
          this.formRegistraVehiculo.get('tipoVehiculo')?.reset(); // Limpiar el valor si se deshabilita
        }
      });

  }

  obtenerClienteId(identificador: string) {
    this.utilService.obtenerIdCliente(identificador).subscribe(
      idCliente => {
        this.formRegistraUsuario.patchValue({ idCliente: idCliente ?? 0 });
      },
      error => console.error('Error al obtener idCliente:', error)
    );
  }
 
  obtenerParqueoId(tipoVehiculo: string) {
    this.utilService.obtenerIdParqueo(tipoVehiculo).subscribe(
      idParqueo => {
        this.formRegistraUsuario.patchValue({ idParqueo: idParqueo ?? 0 });
      },
      error => console.error('Error al obtener idParqueo:', error)
    );
  }
 
 
  obtenerEspacioId(numeroEspacio: number) {
    this.utilService.obtenerIdEspacio(numeroEspacio).subscribe(
      idEspacio => {
        this.formRegistraUsuario.patchValue({ idEspacio: idEspacio ?? 0 });
      },
      error => console.error('Error al obtener idEspacio:', error)
    );
  }

  

  guardarDatos() {
    console.log("Iniciando guardarDatos...");

    // Inicializar objAccesoVehicular con los datos del formulario, asignando IDs si están presentes
    this.objAccesoVehicular = {
      cliente: { idCliente: this.formRegistraUsuario.get('idCliente')?.value || 0 },
      usuario: { idUsuario: this.formRegistraUsuario.get('idUsuario')?.value || 0 },
      parqueo: { idParqueo: this.formRegistraUsuario.get('idParqueo')?.value || 0 },
      espacio: { idEspacio: this.espacioSeleccionado },
      placaVehiculo: this.formRegistraVehiculo.get('placa')?.value || ''
    };

    console.log("PRIMERA DEPURACION");
    console.log("Cliente ID inicial:", this.objAccesoVehicular.cliente?.idCliente);
    console.log("Cliente:", this.objAccesoVehicular.cliente);
    console.log("Usuario:", this.objAccesoVehicular.usuario);
    console.log("Parqueo:", this.objAccesoVehicular.parqueo);
    console.log("Espacio:", this.objAccesoVehicular.espacio);

    const requests = [];

    if (this.objAccesoVehicular.cliente && !this.objAccesoVehicular.cliente.idCliente) {
      const dni = this.formRegistraUsuario.get('dni')?.value;
      if (dni) {
        requests.push(this.utilService.obtenerIdCliente(dni));
      }
    }

    if (this.objAccesoVehicular.parqueo && !this.objAccesoVehicular.parqueo.idParqueo) {
      const tipoVehiculo = this.formRegistraVehiculo.get('tipoVehiculo')?.value;
      if (tipoVehiculo) {
        requests.push(this.utilService.obtenerIdParqueo(tipoVehiculo));
      }
    }

    if (this.objAccesoVehicular.espacio && !this.objAccesoVehicular.espacio.idEspacio) {
      const espacio = this.formRegistraVehiculo.get('espacio')?.value;
      if (espacio) {
        requests.push(this.utilService.obtenerIdEspacio(espacio));
      }
    }

    console.log("SEGUNDA DEPURACION");
    console.log("Cliente ID antes de forkJoin:", this.objAccesoVehicular.cliente?.idCliente);
    console.log("Parqueo ID antes de forkJoin:", this.objAccesoVehicular.parqueo?.idParqueo);
    console.log("Espacio ID antes de forkJoin:", this.objAccesoVehicular.espacio?.idEspacio);

    if (requests.length > 0) {
      forkJoin(requests).subscribe(
        (resultados) => {
          console.log("Resultados de forkJoin:", resultados);

          // Asignar los resultados a los campos correspondientes, asegurando que los objetos existan
              if (resultados[0]) {
                this.objAccesoVehicular.cliente = this.objAccesoVehicular.cliente || {}; // Inicializar si es undefined
                this.objAccesoVehicular.cliente.idCliente = resultados[0];
                console.log("ID Cliente asignado:", resultados[0]);
              }

              if (resultados[1]) {
                this.objAccesoVehicular.parqueo = this.objAccesoVehicular.parqueo || {}; // Inicializar si es undefined
                this.objAccesoVehicular.parqueo.idParqueo = resultados[1];
                console.log("ID Parqueo asignado:", resultados[1]);
              }

              if (resultados[2]) {
                this.objAccesoVehicular.espacio = this.objAccesoVehicular.espacio || {}; // Inicializar si es undefined
                this.objAccesoVehicular.espacio.idEspacio = resultados[2];
                console.log("ID Espacio asignado:", resultados[2]);
              }


          // Registrar el acceso vehicular con los IDs asignados
          console.log("OBJETO PARA REGISTRO DESPUÉS DE forkJoin:", this.objAccesoVehicular);

          this.ingresoVehicularService.registrarAccesoVehicular(this.objAccesoVehicular).subscribe({

            next: (response) => {
              Swal.fire({
                icon: 'info',
                title: 'Registro Exitoso',
                text: response.mensaje,
              });
              console.log('Registro completado:', this.objAccesoVehicular);
            },
            error: (error) => {
              Swal.fire({
                icon: 'error',
                title: 'Error en el registro',
                text: 'Registro no completado.',
              });
              console.error('Error en el registro:', error);
              console.error('JSON DEL REGISTRO:', this.objAccesoVehicular);
            },
            complete: () => {
              console.log('Proceso de registro completado.');
            }
          });
        },
        (error) => {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Ocurrió un error al obtener los datos necesarios.',
          });
          console.error('Error en las peticiones de IDs:', error);
        }
      );
    } else {
      // Si no hay requests pendientes, proceder con el registro directamente
      console.log("No se necesitan peticiones adicionales, registrando acceso vehicular...");

      this.ingresoVehicularService.registrarAccesoVehicular(this.objAccesoVehicular).subscribe({
        next: (response) => {
          Swal.fire({
            icon: 'info',
            title: 'Resultado del Registro',
            text: response.mensaje,
          });
          console.log('Registro completado:', this.objAccesoVehicular);
        },
        error: (error) => {
          Swal.fire({
            icon: 'error',
            title: 'Error en el registro',
            text: 'Registro no completado.',
          });
          console.error('Error en el registro:', error);
          console.error('JSON DEL REGISTRO:', this.objAccesoVehicular);
        },
        complete: () => {
          console.log('Proceso de registro completado.');
        }
      });
    }
  }


// Método para formatear la fecha en "yyyy-MM-dd hh:mm:ss"
private formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}



buscarUsuarioPorDni(){
  console.log(">>> Filtrar EXCEL [ini]");
  console.log(">>> varDni: "+ this.varDni);

  this.usuarioService.buscarUsuarioDni(

   
    this.varDni
    ).subscribe(
      (x) => {
        this.dataSource = x;
 
        // Asegurarse de que los datos existan antes de usarlos
        if (this.dataSource && this.dataSource.length > 0) {
          const usuario = this.dataSource[0]; // Si es una lista, accede al primer usuario
         
          // Llenar los campos del formulario con los datos traídos
          this.formRegistraUsuario.patchValue({
            nombres: usuario.nombres,
            apellidos: usuario.apellidos
          });
          console.log(">>> data: " + usuario.nombres);
        } else {
          console.log(">>> Usuario no encontrado");
          // Limpiar los campos si no hay resultados
          this.formRegistraUsuario.patchValue({
            nombres: '',
            apellidos: ''
          });
        }
      },
      (error) => {
        console.log(">>> Error al buscar por DNI: ", error);
        this.limpiarFormulario();
      }
    );
 
    console.log(">>> Filtrar [fin]");
  }

    buscarClientePorDni() {
      // Verificamos el valor de `varDni` antes de hacer la petición
      console.log('DNI buscado:', this.varDni);

      this.usuarioService.buscarClientePorDni(this.varDni).subscribe(
        (response) => {
          this.dataSource = response;
          console.log('Respuesta del servicio:', this.dataSource);

          if (this.dataSource && this.dataSource.length > 0) {
            const usuario = this.dataSource[0];
            console.log('Usuario encontrado:', usuario);

            // Actualizamos los valores del formulario y de las variables
            this.formRegistraUsuario.patchValue({
              nombres: usuario.nombres,
              apellidos: usuario.apellidos,
            });
            this.formRegistraUsuario.get('nombres')?.disable();
            this.formRegistraUsuario.get('apellidos')?.disable();

            this.varNombres = usuario.nombres;
            this.varApellidos = usuario.apellidos;
          } else {
            Swal.fire('Por favor registrar los nuevos datos del propietario.');

            // Habilitamos y limpiamos los campos del formulario
            this.formRegistraUsuario.get('nombres')?.enable();
            this.formRegistraUsuario.get('apellidos')?.enable();
            this.formRegistraUsuario.patchValue({ nombres: '', apellidos: '' });

            this.varNombres = '';
            this.varApellidos = '';
          }
        },
        (error) => {
          console.error('Error al buscar por DNI:', error);
          this.limpiarFormulario();
        }
      );
    }


  limpiarFormulario() {
    this.formRegistraUsuario.patchValue({ nombres: '', apellidos: '' });
    this.varNombres = '';
    this.varApellidos = '';
  }



  // loadWatsonAssistant(): void {
  //   (window as any).watsonAssistantChatOptions = {
  //     integrationID: "1d7eb15e-bcf5-4ddb-8486-f8c82f1d58de",
  //     region: "au-syd",
  //     serviceInstanceID: "138e5014-a8e7-4f39-a7eb-31c2ebd87e46",
  //     onLoad: (instance: any) => instance.render(),
  //   };

  //   setTimeout(() => {
  //     const script = document.createElement('script');
  //     script.src = "https://web-chat.global.assistant.watson.appdomain.cloud/versions/latest/WatsonAssistantChatEntry.js";
  //     document.head.appendChild(script);
  //   }, 0);
  // }

  seleccionarEspacioN(espacio: number) {
    this.espacioSeleccionado = espacio;
    console.log('Espacio seleccionado:', espacio);
  }

  cargarEspacios() {
    this.traerEspaciosParqueoPrincipal();
    this.traerEspaciosParqueoSotano();
    this.traerEspaciosParqueoSemiSotano();
  }

  traerEspaciosParqueoPrincipal() {
    this.espaciService.listarEspaciosPorIdParqueo(1).subscribe(
      esp => {
        this.objetosEspaciosPP = esp;
        this.objetosEspaciosPP.forEach(espacio => {
          if (espacio.numeroEspacio !== undefined && espacio.estado === "disponible") {
            if (espacio.tipoEspacio === "general") {
              this.espaciosGeneralPP.push(espacio.numeroEspacio.toString());
            } else if (espacio.tipoEspacio === "discapacitado") {
              this.espaciosDiscapacitadoPP.push(espacio.numeroEspacio.toString());
            } else {
              this.espacioGerentePP.push(espacio.numeroEspacio.toString());
            }
          }
        });
      }
    );
  }

  traerEspaciosParqueoSotano() {
    this.espaciService.listarEspaciosPorIdParqueo(2).subscribe(
      esp => {
        this.objetosEspaciosPS = esp;
        this.objetosEspaciosPS.forEach(espacio => {
          if (espacio.numeroEspacio !== undefined && espacio.estado === "disponible") {
            if (espacio.tipoEspacio === "general") {
              this.espaciosGeneralPS.push(espacio.numeroEspacio.toString());
            } else if (espacio.tipoEspacio === "discapacitado") {
              this.espaciosDiscapacitadoPS.push(espacio.numeroEspacio.toString());
            } else {
              this.espacioGerentePS.push(espacio.numeroEspacio.toString());
            }
          }
        });
      }
    );
  }

  traerEspaciosParqueoSemiSotano() {
    this.espaciService.listarEspaciosPorIdParqueo(3).subscribe(
      esp => {
        this.objetosEspaciosPSS = esp;
        this.objetosEspaciosPSS.forEach(espacio => {
          if (espacio.numeroEspacio !== undefined && espacio.estado === "disponible") {
            if (espacio.tipoEspacio === "general") {
              this.espaciosGeneralPSS.push(espacio.numeroEspacio.toString());
            } else if (espacio.tipoEspacio === "discapacitado") {
              this.espaciosDiscapacitadoPSS.push(espacio.numeroEspacio.toString());
            } else {
              this.espacioGerentePSS.push(espacio.numeroEspacio.toString());
            }
          }
        });
      }
    );
  }


  // Manejo de tipo de vehículo
  onTipoVehiculoChange(tipo: string) {
    this.mostrarNivelPrincipal = false;
    this.mostrarNivelSotano = false;
    this.mostrarNivelSemiSotano = false;

    if (tipo === "Automovil") {
      this.mostrarNivelPrincipal = true;
      this.mostrarNivelSotano = true;
    } else if (tipo === "Motocicleta") {
      this.mostrarNivelSemiSotano = true;
    }
  }

    // Selección de espacio
    seleccionarEspacio(espacio: string) {
      this.espacioSeleccionado = Number(espacio);
    }

  guardarNombresApe() {
    const nombresBuscado = this.formRegistraUsuario.get('nombres')?.value ?? '';
    const apellidosBuscado = this.formRegistraUsuario.get('apellidos')?.value ?? '';

    this.varNombres= nombresBuscado;
    this.varApellidos = apellidosBuscado;
 
    console.log('Nombres guardados:', this.varNombres);
    console.log('Apellidos guardados:', this.varApellidos);  
  }


  habilitarBtnSiguienteRegistroUsuario() {
    if (this.formRegistraUsuario.controls.nombres.value?.trim() === "" || this.formRegistraUsuario.controls.apellidos.value?.trim() === "" || this.formRegistraUsuario.invalid === true) {
      //console.log("hay campos vacíos en cliente");
      return true;
    } else {
      return false;
    }
  }

  habilitarBtnSiguienteRegistroVehiculo(){
    if (this.formRegistraVehiculo.invalid === true || this.espacioSeleccionado === 0) {
      //console.log("hay campos vacíos en vehículo");
      return true;
    } else {
      return false;
    }
  }



crearCliente() {
  const nuevoCliente: Cliente = {
    identificador: this.formRegistraUsuario.get('dni')?.value ?? '',
    nombres: this.formRegistraUsuario.get('nombres')?.value ?? '',
    apellidos: this.formRegistraUsuario.get('apellidos')?.value ?? '',
    telefono: this.formRegistraUsuario.get('telefono')?.value ?? ''
  };

    this.ingresoVehicularService.registrarCliente(nuevoCliente).subscribe({
    next: (response) => {
      console.log("Nuevo cliente creado:", response);
      this.formRegistraUsuario.patchValue({ idCliente: response.idCliente });
    },
    error: (error) => {
      console.error("Error al crear cliente:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error en el registro',
        text: 'No se pudo registrar el cliente.',
      });
    }
  });
}


}