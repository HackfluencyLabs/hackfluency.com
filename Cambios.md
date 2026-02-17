
     Cambios a Reaplicar:

     1.  Resumen Ejecutivo:
         *   Medidor de Riesgo (27/100): Se restaurará el tooltip que aparece al pasar el mouse, mostrando la escala de riesgo (Bajo: 0-25, Moderado: 26-50, etc.).  
         *   Indicador de Tendencia (Descendente): Se volverá a añadir el tooltip que detalla la comparación histórica (Anterior: 50 | Actual: 27) y se mostrará e   
     l panel de Análisis Comparativo (Baseline).

     2.  Pestaña de Topología:
         *   Panel de Proximidad Temporal: Se volverá a implementar el desglose que muestra la "Antigüedad datos sociales" y la "Antigüedad infraestructura" con su  
     s tooltips explicativos.
         *   Traducciones: Se corregirán todas las claves que se mostraban incorrectamente (ej. correlation.strength.weak -> baja, classification.type.
     opportunistic -> oportunista).
         *   Paneles Duplicados: Se eliminarán los paneles de "Clasificación" y "Estadísticas IOC" que estaban duplicados en esta vista.

     3.  Lógica de Datos:
         *   Se asegurará que la lógica del pipeline en orchestrator.ts calcule dinámicamente la antigüedad de la infraestructura basándose en el lastUpdate más     
     reciente de los datos de Shodan, y que el frontend (CTIDashboardModern.tsx) utilice esta información.


PUNTOS CLAVE
     - En Detalles completos, queremos mostrar la lista completa de direcciones IPs scrolleable dentro del recuadro que esta implementado actualmente.

     - En la topologia de nodos, debemos mostrar correctamente las direcciones IPs (Clusters para no saturar)

     - Debemos ser consistentes visualmente en como TODOS los datos se correlacionan entre si.

