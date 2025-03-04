FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["CIG/CIG.PDFGenerator.csproj", "CIG/"]
RUN dotnet restore "CIG/CIG.PDFGenerator.csproj"
COPY . .
WORKDIR "/src/CIG"
RUN dotnet build "CIG.PDFGenerator.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "CIG.PDFGenerator.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "CIG.PDFGenerator.dll"]
