import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { FileChunkManager } from 'src/file-chunk-manager/file-chunk.manager';

import {Filesystem, Directory} from "@capacitor/filesystem";
import {Capacitor} from "@capacitor/core";
import write_blob from "capacitor-blob-writer";


@Injectable({
  providedIn: 'root'
})
export class FileServiceService {
  mFileChunkManager: FileChunkManager = new FileChunkManager();
  mLogEntries = '';
  data:any;

  private url:string = 'http://127.0.0.1:8000/accounts/'

  constructor(private http:HttpClient) { }

  create(item:any):Observable<any[]> {
    return this.http.post<any[]>(this.url, item)
  }

  view():Observable<any[]> {
    return this.http.get<any[]>(this.url)
  }

  viewById(id:any):Observable<any> {
    return this.http.get<any>(this.url+'/'+id)
  }

  rem(id:number):Observable<any[]>{
    return this.http.delete<any[]>(this.url+"/"+id)
  }

  edit(id:number, item:any):Observable<any[]>{
    return this.http.put<any[]>(this.url+"/"+id, item)
  }

  public async checkFileSize(tPath: any, result:any):Promise<void>{
    // START THE SERVER
    const offset = 2;
    const lengthToRead = 4; // Change this to suit your needs
    const tFileChunkServerInfo = await this.mFileChunkManager.startServer({ encryption: true });
    if (!tFileChunkServerInfo.ready) {
      console.log('## Failed to start the server');
      return;
    }
    console.log('----FileChunkServerInfo----');
    console.log(JSON.stringify(tFileChunkServerInfo));
    const tFileSize = await this.mFileChunkManager.checkFileSize(tPath);
    console.log('----tFileSize: ' + tFileSize);

    const path = await this.mFileChunkManager.getPath(tPath, Directory.Data)
    console.log('----path OK ( offset 2, length 4)');
    console.log('path:' + JSON.stringify(path));

    try {
      const chunkData = await this.mFileChunkManager.readFileChunk(tPath, offset, lengthToRead);
      console.log(chunkData);
      console.log('----readFileChunk OK ( offset 2, length 4)');
      console.log('Data:' + JSON.stringify(chunkData));
      this.data = chunkData
      console.log('Data:' + JSON.stringify(this.data.Data));
    } catch (error) {
      console.error('An error occurred while reading the file:', error);
    }


    // const tChunkDataws = await this.mFileChunkManager.readFileChunkFS(path, offset, lengthToRead);
    // console.log('----readFileChunk OK2 ( offset 2, length 4)');
    // console.log('Data2:' + JSON.stringify(tChunkDataws));
    // await this.mFileChunkManager.stopServer();
    const blob = new Blob([this.data.Data], { type: result.type });
    console.log("blob file created", JSON.stringify(blob))
    const file = new File([blob], result.title as string, {type: result.type,});
    console.log(" file created", JSON.stringify(file), file.size, file.name, file.type)
    this.data = file
    return this.data
  }

  public async doEverything(): Promise<void> {
    // START THE SERVER
    const tFileChunkServerInfo = await this.mFileChunkManager.startServer({ encryption: true });
    if (!tFileChunkServerInfo.ready) {
      this.add2Console('## Failed to start the server');
      return;
    }

    this.add2Console('----FileChunkServerInfo----');
    this.add2Console(JSON.stringify(tFileChunkServerInfo));

    // CREATE A FILE
    const tPath = await this.mFileChunkManager.createEmptyFile('/test-file.bin', Directory.Data);
    this.add2Console('----tPath: ' + tPath);

    // WRITE TO THE FILE
    const tData: Uint8Array = new Uint8Array([2, 3, 5, 7, 11, 13, 17, 19, 23]); // the data you want to write
    const tOK = await this.mFileChunkManager.appendChunkToFile(tPath, tData);
    if (!tOK) {
      this.add2Console('## Failed to save to the file');
      return;
    }
    this.add2Console('----appendChunkToFile OK');
    this.add2Console('Data:' + JSON.stringify(tData));

    // CHECK THE FILE SIZE
    const tFileSize = await this.mFileChunkManager.checkFileSize(tPath);
    if (tFileSize != tData.length) {
      this.add2Console('## Wrong file size');
      return;
    }
    this.add2Console('----tFileSize: ' + tFileSize);

    // READ FROM FILE
    const tChunkData = await this.mFileChunkManager.readFileChunk(tPath, 2, 4);
    if (tChunkData && tChunkData.length !== 4) {
      this.add2Console('## Error reading from file');
      return;
    }
    this.add2Console('----readFileChunk OK ( offset 2, length 4)');
    this.add2Console('Data:' + JSON.stringify(tChunkData));

    const tData2Compare: Uint8Array = new Uint8Array([5, 7, 11, 13]);
    if (tChunkData && JSON.stringify(tChunkData) !== JSON.stringify(tData2Compare)) {
      this.add2Console('## Error wrong data!');
      return;
    }
    this.add2Console('----Data OK');

    // STOP THE SERVER
    await this.mFileChunkManager.stopServer();

    this.add2Console('----Finished----');
  }

      // ADD TO CONSOLE
      private add2Console(tText: string): void {
        this.mLogEntries += tText + '\n';
        console.log("log---------------------------",tText)
      }


       resolve_uri(path:any, directory:any) {
        if (directory === undefined) {
            directory = Directory.Data;
        }
        return (
                Filesystem.getUri({path, directory}).then(function (result) {
                return Capacitor.convertFileSrc(result.uri);
            })
        );
    }
}
