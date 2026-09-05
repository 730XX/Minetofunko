import type { Funko2DRenderConfig } from '../engine/types';

/**
 * Coordenadas y transformaciones calibradas al 100% en el editor 2D
 * Dimensiones base de la skin reescalada: 1920x1080 (Nearest Neighbor)
 */
export const FUNKO_GROOVER_CONFIG: Funko2DRenderConfig = {
  // El molde base "molde groover.png" (606x882)
  baseWidth: 606,
  baseHeight: 882,
  parts:
    [
      {
        "id": "cabeza-front",
        "name": "Cabeza Frontal",
        "source": {
          "x": 241,
          "y": 136,
          "width": 236,
          "height": 134
        },
        "scale": {
          "width": 158,
          "height": 152
        },
        "destination": {
          "x": 215,
          "y": 385
        }
      },
      {
        "id": "cabeza-derecha",
        "name": "Cabeza Derecha",
        "source": {
          "x": 480,
          "y": 136,
          "width": 236,
          "height": 134
        },
        "scale": {
          "width": 158,
          "height": 152
        },
        "rotateDeg": -90,
        "destination": {
          "x": 373,
          "y": 227
        }
      },
      {
        "id": "cabeza-izquierda",
        "name": "Cabeza Izquierda",
        "source": {
          "x": 0,
          "y": 136,
          "width": 236,
          "height": 134
        },
        "scale": {
          "width": 160,
          "height": 158
        },
        "rotateDeg": 90,
        "destination": {
          "x": 58,
          "y": 227
        }
      },
      {
        "id": "cabeza-arriba",
        "name": "Cabeza Arriba",
        "source": {
          "x": 241,
          "y": 0,
          "width": 236,
          "height": 134
        },
        "scale": {
          "width": 158,
          "height": 158
        },
        "destination": {
          "x": 215,
          "y": 227
        }
      },
      {
        "id": "cabeza-atras",
        "name": "Cabeza Atrás",
        "source": {
          "x": 720,
          "y": 135,
          "width": 236,
          "height": 134
        },
        "scale": {
          "width": 158,
          "height": 154
        },
        "rotateDeg": -180,
        "destination": {
          "x": 215,
          "y": 75
        }
      },
      {
        "id": "cabeza-abajo",
        "name": "Cabeza Abajo",
        "source": {
          "x": 480,
          "y": 0,
          "width": 236,
          "height": 134
        },
        "scale": {
          "width": 158,
          "height": 158
        },
        "rotateDeg": -180,
        "destination": {
          "x": 215,
          "y": 537
        }
      },
      {
        "id": "pecho-delantero",
        "name": "Pecho Delantero",
        "source": {
          "x": 480,
          "y": 337,
          "width": 360,
          "height": 266
        },
        "scale": {
          "width": 152,
          "height": 126
        },
        "rotateDeg": -270,
        "destination": {
          "x": 377,
          "y": 682
        }
      },
      {
        "id": "pecho-trasero",
        "name": "Pecho Trasero (Espalda)",
        "source": {
          "x": 810,
          "y": 337,
          "width": 390,
          "height": 266
        },
        "scale": {
          "width": 153,
          "height": 127
        },
        "rotateDeg": 90,
        "destination": {
          "x": 377,
          "y": 529
        }
      },
      {
        "id": "capucha-trasera",
        "name": "Capucha Trasera",
        "source": {
          "x": 600,
          "y": 270,
          "width": 240,
          "height": 67
        },
        "scale": {
          "width": 96,
          "height": 56
        },
        "rotateDeg": 270,
        "destination": {
          "x": 504,
          "y": 586
        }
      },
      {
        "id": "brazo-izq-adelante",
        "name": "Brazo Izquierdo Adelante",
        "source": {
          "x": 1080,
          "y": 876,
          "width": 120,
          "height": 204
        },
        "scale": {
          "width": 33,
          "height": 65
        },
        "destination": {
          "x": 522,
          "y": 90
        }
      },
      {
        "id": "brazo-izq-izq",
        "name": "Brazo Izquierdo Lado Izquierdo",
        "source": {
          "x": 960,
          "y": 876,
          "width": 119,
          "height": 204
        },
        "scale": {
          "width": 31,
          "height": 65
        },
        "destination": {
          "x": 491,
          "y": 90
        }
      },
      {
        "id": "brazo-izq-atras",
        "name": "Brazo Izquierdo Atrás",
        "source": {
          "x": 1321,
          "y": 876,
          "width": 120,
          "height": 204
        },
        "scale": {
          "width": 32,
          "height": 65
        },
        "destination": {
          "x": 459,
          "y": 90
        }
      },
      {
        "id": "brazo-izq-der",
        "name": "Brazo Izquierdo Lado Derecho",
        "source": {
          "x": 1200,
          "y": 876,
          "width": 120,
          "height": 204
        },
        "scale": {
          "width": 33,
          "height": 65
        },
        "destination": {
          "x": 426,
          "y": 90
        }
      },
      {
        "id": "brazo-izq-mano",
        "name": "Brazo Izquierdo Mano",
        "source": {
          "x": 1200,
          "y": 809,
          "width": 120,
          "height": 68
        },
        "scale": {
          "width": 33,
          "height": 31
        },
        "mirrorHorizontal": true,
        "destination": {
          "x": 522,
          "y": 155
        }
      },
      {
        "id": "brazo-izq-hombro",
        "name": "Brazo Izquierdo Hombro",
        "source": {
          "x": 1080,
          "y": 793,
          "width": 120,
          "height": 68
        },
        "scale": {
          "width": 33,
          "height": 33
        },
        "destination": {
          "x": 459,
          "y": 57
        }
      },
      {
        "id": "brazo-der-adelante",
        "name": "Brazo Derecho Adelante",
        "source": {
          "x": 1320,
          "y": 337,
          "width": 120,
          "height": 204
        },
        "scale": {
          "width": 33,
          "height": 65
        },
        "destination": {
          "x": 148,
          "y": 84
        }
      },
      {
        "id": "brazo-der-der",
        "name": "Brazo Derecho Lado Derecho",
        "source": {
          "x": 1440,
          "y": 337,
          "width": 120,
          "height": 204
        },
        "scale": {
          "width": 31,
          "height": 65
        },
        "destination": {
          "x": 54,
          "y": 84
        }
      },
      {
        "id": "brazo-der-atras",
        "name": "Brazo Derecho Atrás",
        "source": {
          "x": 1560,
          "y": 337,
          "width": 120,
          "height": 204
        },
        "scale": {
          "width": 34,
          "height": 65
        },
        "destination": {
          "x": 85,
          "y": 84
        }
      },
      {
        "id": "brazo-der-izq",
        "name": "Brazo Derecho Lado Izquierdo",
        "source": {
          "x": 1200,
          "y": 337,
          "width": 120,
          "height": 204
        },
        "scale": {
          "width": 29,
          "height": 65
        },
        "destination": {
          "x": 119,
          "y": 84
        }
      },
      {
        "id": "brazo-der-hombro",
        "name": "Brazo Derecho Hombro",
        "source": {
          "x": 1320,
          "y": 270,
          "width": 120,
          "height": 68
        },
        "scale": {
          "width": 34,
          "height": 32
        },
        "mirrorHorizontal": true,
        "destination": {
          "x": 85,
          "y": 52
        },
        "rotateDeg": 180
      },
      {
        "id": "brazo-der-mano",
        "name": "Brazo Derecho Mano",
        "source": {
          "x": 1440,
          "y": 270,
          "width": 120,
          "height": 68
        },
        "scale": {
          "width": 33,
          "height": 33
        },
        "destination": {
          "x": 148,
          "y": 149
        }
      },
      {
        "id": "pierna-izq-adelante",
        "name": "Pierna Izquierda Adelante",
        "source": {
          "x": 600,
          "y": 876,
          "width": 120,
          "height": 204
        },
        "scale": {
          "width": 33,
          "height": 65
        },
        "rotateDeg": 90,
        "mirrorHorizontal": true,
        "destination": {
          "x": 86,
          "y": 423
        }
      },
      {
        "id": "pierna-izq-der",
        "name": "Pierna Izquierda Lado Derecho",
        "source": {
          "x": 720,
          "y": 876,
          "width": 120,
          "height": 204
        },
        "scale": {
          "width": 57,
          "height": 65
        },
        "rotateDeg": 90,
        "mirrorHorizontal": true,
        "destination": {
          "x": 86,
          "y": 455
        }
      },
      {
        "id": "pierna-izq-atras",
        "name": "Pierna Izquierda Atrás",
        "source": {
          "x": 840,
          "y": 876,
          "width": 120,
          "height": 204
        },
        "scale": {
          "width": 33,
          "height": 65
        },
        "rotateDeg": 90,
        "mirrorHorizontal": true,
        "destination": {
          "x": 86,
          "y": 510
        }
      },
      {
        "id": "pierna-izq-izq",
        "name": "Pierna Izquierda Lado Izquierdo",
        "source": {
          "x": 480,
          "y": 876,
          "width": 120,
          "height": 204
        },
        "scale": {
          "width": 60,
          "height": 65
        },
        "rotateDeg": 90,
        "mirrorHorizontal": true,
        "destination": {
          "x": 86,
          "y": 543
        }
      },
      {
        "id": "pierna-izq-pie",
        "name": "Pierna Izquierda Pie",
        "source": {
          "x": 720,
          "y": 810,
          "width": 120,
          "height": 68
        },
        "scale": {
          "width": 32,
          "height": 59
        },
        "mirrorHorizontal": true,
        "destination": {
          "x": 150,
          "y": 544
        }
      },
      {
        "id": "pierna-izq-muslo",
        "name": "Pierna Izquierda Muslo",
        "source": {
          "x": 600,
          "y": 810,
          "width": 120,
          "height": 68
        },
        "scale": {
          "width": 32,
          "height": 59
        },
        "mirrorHorizontal": true,
        "destination": {
          "x": 55,
          "y": 544
        }
      },
      {
        "id": "pierna-der-adelante",
        "name": "Pierna Derecha Adelante",
        "source": {
          "x": 120,
          "y": 337,
          "width": 120,
          "height": 204
        },
        "scale": {
          "width": 33,
          "height": 65
        },
        "rotateDeg": 90,
        "destination": {
          "x": 86,
          "y": 785
        }
      },
      {
        "id": "pierna-der-izq",
        "name": "Pierna Derecha Lado Izquierdo",
        "source": {
          "x": 0,
          "y": 337,
          "width": 120,
          "height": 204
        },
        "scale": {
          "width": 59,
          "height": 65
        },
        "rotateDeg": 90,
        "destination": {
          "x": 86,
          "y": 726
        }
      },
      {
        "id": "pierna-der-atras",
        "name": "Pierna Derecha Atrás",
        "source": {
          "x": 360,
          "y": 337,
          "width": 120,
          "height": 204
        },
        "scale": {
          "width": 33,
          "height": 65
        },
        "rotateDeg": 90,
        "destination": {
          "x": 86,
          "y": 694
        }
      },
      {
        "id": "pierna-der-der",
        "name": "Pierna Derecha Lado Derecho",
        "source": {
          "x": 240,
          "y": 337,
          "width": 120,
          "height": 204
        },
        "scale": {
          "width": 60,
          "height": 65
        },
        "rotateDeg": 90,
        "mirrorHorizontal": false,
        "destination": {
          "x": 86,
          "y": 635
        }
      },
      {
        "id": "pierna-der-pie",
        "name": "Pierna Derecha Pie",
        "source": {
          "x": 240,
          "y": 270,
          "width": 120,
          "height": 68
        },
        "scale": {
          "width": 32,
          "height": 59
        },
        "rotateDeg": 180,
        "destination": {
          "x": 55,
          "y": 727
        }
      },
      {
        "id": "pierna-der-muslo",
        "name": "Pierna Derecha Muslo",
        "source": {
          "x": 120,
          "y": 270,
          "width": 120,
          "height": 68
        },
        "scale": {
          "width": 32,
          "height": 59
        },
        "rotateDeg": -180,
        "destination": {
          "x": 150,
          "y": 727
        }
      }
    ]
};
