package edu.asupoly.ser421;


import java.io.*;
import java.net.*;
import java.util.*;

public class Lab1Part2 {
    public static void main(String[] args) {
        try {
            if(args.length!=5){
                System.out.println("Incorrect arguments");
            }
            int localport = Integer.parseInt(args[0]);
            String host = args[1];
            int remoteport = Integer.parseInt(args[2]);
            int cachesize = Integer.parseInt(args[3]);
            int delay = Integer.parseInt(args[4]);
//            if (args.length != 3)
//                throw new IllegalArgumentException("insuficient arguments");
            // and the local port that we listen for connections on



            // Print a start-up message
            System.out.println("Proxy Started");
            CacheClass cache = new CacheClass(cachesize);
            ServerSocket server = new ServerSocket(localport);
            Boolean serverStart = true;
            while (serverStart) {
                new ThreadProxy(server.accept(), host, remoteport,cache,delay);
            }
        } catch (Exception e) {
            System.err.println(e);

        }
    }
}
@SuppressWarnings("ALL")
class ThreadProxy extends Thread {

    Socket clientSocket;
    String hostUrl;
    int remotePort;
    int delay;
    CacheClass cache;

    ThreadProxy(Socket sClient, String serverUrl, int serverPort, CacheClass cache, int delay) {
        this.clientSocket = sClient;
        this.hostUrl = serverUrl;
        this.remotePort = serverPort;
        System.out.println("start x");
        this.cache = cache;
        this.delay = delay;
        this.start();

    }

    @Override
    public void run() {
        try {

            this.sleep(delay);

            InputStreamReader inFromClient = new InputStreamReader(clientSocket.getInputStream());
            PrintStream outToClient = new PrintStream(clientSocket.getOutputStream());
            Socket client = null, server = null;
            System.out.println("3");
            try {
                server = new Socket(hostUrl, remotePort);
            } catch (IOException e) {
                e.printStackTrace();
            }

            final InputStreamReader inFromServer = new InputStreamReader(server.getInputStream());
            final PrintStream outToServer = new PrintStream(server.getOutputStream());
            //System.out.println("2");
            BufferedReader brClient = new BufferedReader(inFromClient);
            BufferedReader brServer = new BufferedReader((inFromServer));

            String beforeInputLine;
            int count = 0;
            String file = "";
            StringBuilder stringBuilder = new StringBuilder();
            while ((beforeInputLine = brClient.readLine()) != null) {

                try{
                    stringBuilder.append(beforeInputLine+"\r\n");
                    StringTokenizer tokenizer = new StringTokenizer(beforeInputLine);
                    tokenizer.nextToken();
                }catch (Exception e){
                    break;
                }
                if (count == 0) {
                    String[] tokens = beforeInputLine.split(" ");
                    file = tokens[1];
                    //can redirect this to output log
                    System.out.println("Request for : " + file);
                }

                count++;

            }


            String inputLine, outputLine;
            String finalResponse = cache.checkCache(file);
            if( finalResponse.equals("Miss")){
                System.out.println("Miss");
                outToServer.print(stringBuilder);
                StringBuilder repsonseFromServer = new StringBuilder();
                while ((outputLine = brServer.readLine()) != null ){
                    try {
                        //System.out.println(outputLine);
                        repsonseFromServer.append(outputLine+"\n");
                        outToClient.println(outputLine);
                        StringTokenizer tokenizer = new StringTokenizer(outputLine);
                        tokenizer.nextToken();
                    } catch (Exception e) {
                        break;
                    }
                }
                cache.addToCache(file,repsonseFromServer.toString());
                //System.out.println("Added to cache  - "+ cache.checkCache(file));

            }
            else{
                System.out.print("Hit");
                outToClient.print(finalResponse);
            }


















        try {

        }finally {
            try {
                if (server != null)
                    server.close();
                if (client != null)
                    client.close();
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
            outToClient.close();
            clientSocket.close();

        } catch (IOException e) {
            e.printStackTrace();
        } catch (InterruptedException e) {
            e.printStackTrace();
        }

    }
}

class CacheClass {

    int maxsize=0;

    HashMap<String, String> cacheFiles = new HashMap<String, String>();
    LinkedList<String> lru = new LinkedList<>();

    CacheClass(int maxsize){
        this.maxsize = maxsize/5;


    }

    String filename = "";
    String reponse = "";

    public HashMap<String, String> getCacheFiles() {
        return cacheFiles;
    }

    public void setCacheFiles(HashMap<String, String> cacheFiles) {
        this.cacheFiles = cacheFiles;
    }

    public synchronized String checkCache(String filename){

        if(cacheFiles.containsKey(filename)){
            lru.removeFirstOccurrence(filename);
            lru.addFirst(filename);
            return cacheFiles.get(filename);
        }
        return "Miss";

    }


    public synchronized  void  addToCache (String filename, String reponse){

        if(cacheFiles.size()<maxsize){
            //add
            cacheFiles.put(filename,reponse);
            lru.addFirst(filename);
        }
        else if(cacheFiles.size()>=maxsize){
            //remove and add
            lru.remove(maxsize);
            cacheFiles.remove(filename);
            lru.addFirst(filename);
            cacheFiles.put(filename,reponse);



        }

    }

}